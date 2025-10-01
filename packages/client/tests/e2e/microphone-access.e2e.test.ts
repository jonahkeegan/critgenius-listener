import { test, expect } from '@playwright/test';
import path from 'node:path';
import net from 'node:net';
import fs from 'node:fs';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientRoot = path.resolve(currentDir, '../..');

let httpsServer: https.Server | undefined;
let httpsPort: number;
let guardBootstrap: string;

async function allocatePort(): Promise<number> {
  return await new Promise<number>(resolve => {
    const srv = net.createServer();
    srv.listen(0, () => {
      const address = srv.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      srv.close(() => resolve(port));
    });
  });
}

async function compileGuardBundle(): Promise<string> {
  const entry = path.resolve(
    clientRoot,
    'src/services/microphoneAccessGuard.ts'
  );
  const result = await build({
    entryPoints: [entry],
    bundle: true,
    format: 'iife',
    globalName: 'MicrophoneAccessGuardModule',
    platform: 'browser',
    target: ['es2022'],
    write: false,
    sourcemap: false,
    minify: true,
  });
  const source = result.outputFiles[0]?.text ?? '';
  return `${source}\nwindow.__createMicrophoneAccessGuard = MicrophoneAccessGuardModule.createMicrophoneAccessGuard;\nwindow.__MICROPHONE_ACCESS_STATUS = MicrophoneAccessGuardModule.MICROPHONE_ACCESS_STATUS;`;
}

test.beforeAll(async () => {
  httpsPort = await allocatePort();
  guardBootstrap = await compileGuardBundle();

  const certDir = path.resolve(clientRoot, 'tests/fixtures/devcert');
  const key = fs.readFileSync(path.join(certDir, 'localhost-key.pem'));
  const cert = fs.readFileSync(path.join(certDir, 'localhost.pem'));

  httpsServer = https.createServer({ key, cert }, (_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(
      '<!doctype html><html><head><meta charset="utf-8"><title>Microphone Guard Test</title></head><body></body></html>'
    );
  });

  await new Promise<void>(resolve => {
    httpsServer!.listen(httpsPort, resolve);
  });
});

test.afterAll(async () => {
  await new Promise<void>(resolve => {
    if (!httpsServer) {
      resolve();
      return;
    }
    httpsServer.close(() => resolve());
  });
});

test('microphone guard grants access over HTTPS', async ({
  page,
  context,
  browserName,
}) => {
  test.slow();
  const origin = `https://localhost:${httpsPort}`;

  if (browserName === 'chromium') {
    await context.grantPermissions(['microphone'], { origin });
  }

  await page.addInitScript({ content: guardBootstrap });

  await page.goto(origin, { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(
    async ({
      bootstrapSource,
      skipNative,
    }: {
      bootstrapSource: string;
      skipNative: boolean;
    }) => {
      type GuardEvaluation = { status: string };
      type GuardRequest =
        | { status: 'granted'; stream: MediaStream; trackCount: number }
        | { status: 'blocked'; reason: string }
        | { status: 'error'; reason: string };
      type GuardInstance = {
        evaluate: () => Promise<GuardEvaluation>;
        requestAccess: () => Promise<GuardRequest>;
      };

      const ensureSyntheticUserMedia = () => {
        if (!navigator.mediaDevices) {
          Object.defineProperty(navigator, 'mediaDevices', {
            value: {},
            configurable: true,
            enumerable: true,
            writable: true,
          });
        }

        const mediaDevices = navigator.mediaDevices as MediaDevices;
        const originalGetUserMedia = skipNative
          ? undefined
          : mediaDevices.getUserMedia?.bind(mediaDevices);

        mediaDevices.getUserMedia = async constraints => {
          if (originalGetUserMedia) {
            try {
              return await originalGetUserMedia(constraints);
            } catch (error) {
              if (
                error &&
                (error instanceof DOMException || error instanceof Error) &&
                (error.name === 'NotAllowedError' ||
                  error.name === 'SecurityError')
              ) {
                throw error;
              }
            }
          }
          try {
            return new MediaStream();
          } catch {
            const track: MediaStreamTrack = {
              kind: 'audio',
              label: 'SyntheticAudioTrack',
              enabled: true,
              muted: false,
              readyState: 'live',
              id: `synthetic-audio-${Date.now()}`,
              stop() {
                /* noop */
              },
              addEventListener() {
                /* noop */
              },
              removeEventListener() {
                /* noop */
              },
              dispatchEvent() {
                return false;
              },
              applyConstraints: async () => undefined,
              getCapabilities: () => ({}),
              getConstraints: () => ({}),
              getSettings: () => ({}),
              clone() {
                return this;
              },
              onended: null,
              onmute: null,
              onunmute: null,
            } as unknown as MediaStreamTrack;
            const tracks = [track];
            const syntheticStream: Partial<MediaStream> = {};
            syntheticStream.getTracks = () => tracks;
            syntheticStream.getAudioTracks = () => tracks;
            syntheticStream.getVideoTracks = () => [];
            syntheticStream.addTrack = () => undefined;
            syntheticStream.removeTrack = () => undefined;
            syntheticStream.clone = () => syntheticStream as MediaStream;
            return syntheticStream as MediaStream;
          }
        };
      };

      ensureSyntheticUserMedia();

      let createGuard = (
        window as { __createMicrophoneAccessGuard?: () => GuardInstance }
      ).__createMicrophoneAccessGuard;
      let statusEnum = (
        window as { __MICROPHONE_ACCESS_STATUS?: Record<string, string> }
      ).__MICROPHONE_ACCESS_STATUS;

      if (
        (!createGuard || !statusEnum) &&
        typeof bootstrapSource === 'string'
      ) {
        new Function(bootstrapSource)();
        createGuard = (
          window as { __createMicrophoneAccessGuard?: () => GuardInstance }
        ).__createMicrophoneAccessGuard;
        statusEnum = (
          window as { __MICROPHONE_ACCESS_STATUS?: Record<string, string> }
        ).__MICROPHONE_ACCESS_STATUS;
      }

      if (!createGuard || !statusEnum) {
        return {
          evaluationStatus: 'MISSING',
          requestStatus: 'missing',
          trackCount: 0,
          requestReason: 'guard-bootstrap-missing',
        } as const;
      }

      const guard = createGuard();
      const evaluation = await guard.evaluate();
      if (evaluation.status !== statusEnum.SUPPORTED) {
        return {
          evaluationStatus: evaluation.status,
          requestStatus: 'skipped',
          trackCount: 0,
          requestReason: 'evaluation-not-supported',
        } as const;
      }

      const request = await guard.requestAccess();
      if (request.status === 'granted') {
        request.stream
          .getTracks()
          .forEach((track: MediaStreamTrack) => track.stop());
        return {
          evaluationStatus: evaluation.status,
          requestStatus: request.status,
          trackCount: request.trackCount,
          requestReason: null,
        } as const;
      }

      return {
        evaluationStatus: evaluation.status,
        requestStatus: request.status,
        trackCount: 0,
        requestReason: (request as { reason?: string }).reason ?? 'unknown',
      } as const;
    },
    { bootstrapSource: guardBootstrap, skipNative: browserName === 'webkit' }
  );

  expect(result.evaluationStatus).toBe('SUPPORTED');
  expect(result.requestStatus).toBe('granted');
  const minimumTrackCount = browserName === 'webkit' ? 0 : 1;
  expect(result.trackCount).toBeGreaterThanOrEqual(minimumTrackCount);
});
