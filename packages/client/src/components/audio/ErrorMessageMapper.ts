import type { AudioCaptureErrorCode } from '../../services/audioCapture';
import {
  AUDIO_ERROR_ACTION_STEPS,
  AUDIO_ERROR_MESSAGES,
  DEFAULT_AUDIO_LOCALE,
  type AudioCaptureMessageLocale,
} from './LocalizedMessages';

const FALLBACK_MESSAGE =
  'We could not access the microphone. Please try again or update your browser settings.';

const FALLBACK_STEPS: string[] = [
  'Check that your microphone is connected and not muted.',
  'Reload the page and accept the permission prompt.',
];

const normalizeLocale = (
  locale: string | undefined
): AudioCaptureMessageLocale => {
  if (!locale) {
    return DEFAULT_AUDIO_LOCALE;
  }

  const normalized = locale as AudioCaptureMessageLocale;
  if (AUDIO_ERROR_MESSAGES[normalized]) {
    return normalized;
  }

  return DEFAULT_AUDIO_LOCALE;
};

export const getLocalizedMessage = (
  code: AudioCaptureErrorCode,
  locale?: string
): string => {
  const targetLocale = normalizeLocale(locale);
  const messages = AUDIO_ERROR_MESSAGES[targetLocale];
  return messages[code] ?? FALLBACK_MESSAGE;
};

export const getActionableSteps = (
  code: AudioCaptureErrorCode,
  locale?: string
): string[] => {
  const targetLocale = normalizeLocale(locale);
  const steps = AUDIO_ERROR_ACTION_STEPS[targetLocale];
  return steps[code] ?? FALLBACK_STEPS;
};
