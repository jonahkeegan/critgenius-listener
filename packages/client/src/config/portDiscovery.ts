import http from 'node:http';
import https from 'node:https';

export interface PortDiscoveryConfig {
  autoDiscover: boolean;
  candidatePorts: number[];
  discoveryTimeoutMs: number;
  probeTimeoutMs: number;
  fallbackPort: number;
  https: boolean; // determines health check protocol
}

export type ProbeStatus =
  | 'success'
  | 'timeout'
  | 'connection-failed'
  | 'invalid-response';

export interface ProbeResult {
  port: number;
  status: ProbeStatus;
  elapsedMs: number;
}

export interface DiscoveryResult {
  port: number;
  discovered: boolean;
  probeResults: ProbeResult[];
}

export interface LogSafeResult {
  discovered: boolean;
  port: number;
  attempts: Array<{ port: number; status: ProbeStatus; elapsedMs: number }>;
}

/**
 * PortDiscoveryService performs lightweight health probes against localhost backend
 * candidates to determine the active server port. It avoids logging any response
 * bodies or headers and only records minimal timing + port info.
 */
export class PortDiscoveryService {
  private readonly HEALTH_PATH = '/api/health';

  async discoverBackendPort(
    config: PortDiscoveryConfig
  ): Promise<DiscoveryResult> {
    const start = Date.now();
    const results: ProbeResult[] = [];
    if (!config.autoDiscover) {
      return {
        port: config.fallbackPort,
        discovered: false,
        probeResults: results,
      };
    }

    const overallDeadline = start + config.discoveryTimeoutMs;
    for (const port of config.candidatePorts) {
      if (Date.now() >= overallDeadline) break;
      const remainingOverall = overallDeadline - Date.now();
      const perAttemptTimeout = Math.max(
        100,
        Math.min(config.probeTimeoutMs, remainingOverall)
      );
      const r = await this.probePort(port, perAttemptTimeout, config.https);
      results.push(r);
      if (r.status === 'success') {
        const out: DiscoveryResult = {
          port,
          discovered: true,
          probeResults: results,
        };
        this.logSanitized(out);
        return out;
      }
    }
    const out: DiscoveryResult = {
      port: config.fallbackPort,
      discovered: false,
      probeResults: results,
    };
    this.logSanitized(out, true);
    return out;
  }

  private async probePort(
    port: number,
    timeoutMs: number,
    httpsMode: boolean
  ): Promise<ProbeResult> {
    const protocol = httpsMode ? 'https:' : 'http:';
    const agent = httpsMode
      ? new https.Agent({ keepAlive: true, rejectUnauthorized: false })
      : new http.Agent({ keepAlive: true });
    const begin = Date.now();
    const options: http.RequestOptions = {
      protocol,
      hostname: 'localhost',
      port,
      path: this.HEALTH_PATH,
      method: 'GET',
      agent: agent as unknown as http.Agent,
      timeout: timeoutMs,
      headers: { Accept: 'application/json' },
    };

    return new Promise<ProbeResult>(resolve => {
      const lib = httpsMode ? https : http;
      const req = lib.request(options, res => {
        // Consider 200-299 as potential success, but do minimal parsing without buffering body
        const elapsedMs = Date.now() - begin;
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ port, status: 'success', elapsedMs });
        } else {
          resolve({ port, status: 'invalid-response', elapsedMs });
        }
        // Ensure we consume and discard any response data to free socket
        res.resume();
      });
      req.on('timeout', () => {
        const elapsedMs = Date.now() - begin;
        req.destroy(new Error('timeout'));
        resolve({ port, status: 'timeout', elapsedMs });
      });
      req.on('error', () => {
        const elapsedMs = Date.now() - begin;
        resolve({ port, status: 'connection-failed', elapsedMs });
      });
      req.end();
    });
  }

  private sanitizeLogOutput(result: DiscoveryResult): LogSafeResult {
    return {
      discovered: result.discovered,
      port: result.port,
      attempts: result.probeResults.map(r => ({
        port: r.port,
        status: r.status,
        elapsedMs: r.elapsedMs,
      })),
    };
  }

  private logSanitized(result: DiscoveryResult, warn = false) {
    const data = this.sanitizeLogOutput(result);
    const prefix = '[devProxy:discovery]';
    if (warn || !result.discovered) {
      console.warn(prefix, JSON.stringify(data));
    } else {
      console.info(prefix, JSON.stringify(data));
    }
  }
}

export default PortDiscoveryService;
