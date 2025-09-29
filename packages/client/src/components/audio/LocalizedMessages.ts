import type { AudioCaptureErrorCode } from '../../services/audioCapture';

export type AudioCaptureMessageLocale = 'en-US';

export const DEFAULT_AUDIO_LOCALE: AudioCaptureMessageLocale = 'en-US';

const enUsMessages: Record<AudioCaptureErrorCode, string> = {
  SECURE_CONTEXT_REQUIRED:
    'Microphone access requires a secure HTTPS connection. Please reload over HTTPS.',
  PERMISSION_BLOCKED:
    'Microphone permission is blocked. Enable access in your browser settings to continue.',
  UNSUPPORTED: 'Microphone access is unavailable on this browser or device.',
  STREAM_ERROR: 'We could not start the microphone stream. Please try again.',
  AUDIO_CONTEXT_FAILED:
    'The audio engine failed to initialize. Refresh the page and try again.',
  RETRY_EXHAUSTED:
    'We tried multiple times but could not access the microphone.',
};

const enUsSteps: Record<AudioCaptureErrorCode, string[]> = {
  SECURE_CONTEXT_REQUIRED: [
    'Reload the page using https:// instead of http://.',
    'If you are on localhost, enable the development HTTPS certificate.',
  ],
  PERMISSION_BLOCKED: [
    'Click the browser address bar lock icon.',
    'Find the Microphone permission and set it to Allow.',
    'Reload the page to apply the updated permission.',
  ],
  UNSUPPORTED: [
    'Update to the latest version of Chrome, Edge, or Firefox.',
    'Verify your device has an available microphone input.',
  ],
  STREAM_ERROR: [
    'Check that no other application is exclusively using the microphone.',
    'Refresh the page and attempt to start capture again.',
  ],
  AUDIO_CONTEXT_FAILED: [
    'Close other browser tabs that use audio capture.',
    'Refresh the page to rebuild the audio context.',
  ],
  RETRY_EXHAUSTED: [
    'Ensure your microphone is connected and not muted at the hardware level.',
    'Reload the page and grant permission when prompted.',
  ],
};

export const AUDIO_ERROR_MESSAGES: Record<
  AudioCaptureMessageLocale,
  Record<AudioCaptureErrorCode, string>
> = {
  'en-US': enUsMessages,
};

export const AUDIO_ERROR_ACTION_STEPS: Record<
  AudioCaptureMessageLocale,
  Record<AudioCaptureErrorCode, string[]>
> = {
  'en-US': enUsSteps,
};
