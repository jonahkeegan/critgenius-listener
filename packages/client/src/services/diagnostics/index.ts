export type { StructuredAudioEvent } from './AudioEventSchema';
export type {
  StructuredEventLevel,
  StructuredAudioEventInput,
  StructuredEventReporter,
  StructuredEventReporterOptions,
  StructuredEventTransport,
} from './StructuredEventReporter';

export { createStructuredEventReporter } from './StructuredEventReporter';
export {
  AUDIO_CAPTURE_COMPONENT,
  structuredAudioEventSchema,
} from './AudioEventSchema';
