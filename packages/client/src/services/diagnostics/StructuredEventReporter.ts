import type { ZodError } from 'zod';
import {
  AUDIO_CAPTURE_COMPONENT,
  structuredAudioEventSchema,
  type StructuredAudioEvent,
} from './AudioEventSchema';

export type StructuredEventLevel = StructuredAudioEvent['level'];

export type StructuredAudioEventInput = Omit<
  StructuredAudioEvent,
  'timestamp' | 'context'
> & {
  timestamp?: number;
  context?: Partial<StructuredAudioEvent['context']>;
};

export type StructuredEventTransport = (event: StructuredAudioEvent) => void;

export interface StructuredEventReporterOptions {
  /** Static context applied to every event emitted by this reporter. */
  context?: StructuredAudioEvent['context'];
  /**
   * Transports invoked with validated events. Defaults to a console sink that preserves privacy by
   * logging only structural data.
   */
  transports?: StructuredEventTransport[];
  /** Injected time provider to enable deterministic testing. Defaults to Date.now. */
  timeProvider?: () => number;
  /** Optional validation error callback for diagnostics. */
  onValidationError?: (error: ZodError, event: unknown) => void;
}

export interface StructuredEventReporter {
  emit(event: StructuredAudioEventInput): void;
  createChild(
    context: Partial<StructuredAudioEvent['context']>
  ): StructuredEventReporter;
}

const ensureTimestamp = (
  input: StructuredAudioEventInput,
  timeProvider: () => number
): number => {
  if (typeof input.timestamp === 'number') {
    return input.timestamp;
  }
  return timeProvider();
};

const mergeContext = (
  base: StructuredAudioEvent['context'] | undefined,
  update: Partial<StructuredAudioEvent['context']> | undefined
): StructuredAudioEvent['context'] => ({
  component: AUDIO_CAPTURE_COMPONENT,
  ...base,
  ...update,
});

const defaultConsoleTransport: StructuredEventTransport = event => {
  const { event: eventName, level, code, metadata, context } = event;
  console.info('[audio-event]', {
    event: eventName,
    level,
    code,
    metadata,
    context,
  });
};

const sanitizeEvent = (
  event: StructuredAudioEventInput,
  baseContext: StructuredAudioEvent['context'] | undefined,
  timeProvider: () => number
): StructuredAudioEvent => ({
  ...event,
  timestamp: ensureTimestamp(event, timeProvider),
  context: mergeContext(baseContext, event.context),
});

class StructuredEventReporterImpl implements StructuredEventReporter {
  constructor(
    private readonly transports: StructuredEventTransport[],
    private readonly timeProvider: () => number,
    private readonly context: StructuredAudioEvent['context'] | undefined,
    private readonly onValidationError?: (
      error: ZodError,
      event: unknown
    ) => void
  ) {}

  emit(event: StructuredAudioEventInput): void {
    const enriched = sanitizeEvent(event, this.context, this.timeProvider);
    const validation = structuredAudioEventSchema.safeParse(enriched);
    if (!validation.success) {
      this.onValidationError?.(validation.error, enriched);
      if (!this.onValidationError) {
        console.warn('[audio-event][invalid]', validation.error.issues);
      }
      return;
    }
    for (const transport of this.transports) {
      try {
        transport(validation.data);
      } catch (error) {
        console.warn('[audio-event][transport-error]', error);
      }
    }
  }

  createChild(
    context: Partial<StructuredAudioEvent['context']>
  ): StructuredEventReporter {
    return new StructuredEventReporterImpl(
      this.transports,
      this.timeProvider,
      mergeContext(this.context, context),
      this.onValidationError
    );
  }
}

export const createStructuredEventReporter = (
  options: StructuredEventReporterOptions = {}
): StructuredEventReporter => {
  const transports = options.transports?.length
    ? options.transports
    : [defaultConsoleTransport];
  const timeProvider = options.timeProvider ?? (() => Date.now());
  const context = options.context
    ? mergeContext(undefined, options.context)
    : ({
        component: AUDIO_CAPTURE_COMPONENT,
      } as StructuredAudioEvent['context']);

  return new StructuredEventReporterImpl(
    transports,
    timeProvider,
    context,
    options.onValidationError
  );
};
