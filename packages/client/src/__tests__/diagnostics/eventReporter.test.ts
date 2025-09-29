import { describe, expect, it, vi } from 'vitest';
import {
  createStructuredEventReporter,
  type StructuredAudioEvent,
} from '../../services/diagnostics';

describe('StructuredEventReporter', () => {
  it('populates timestamp and default context when emitting events', () => {
    const events: StructuredAudioEvent[] = [];
    const reporter = createStructuredEventReporter({
      transports: [event => events.push(event)],
      timeProvider: () => 1234,
    });

    reporter.emit({
      event: 'audio.capture.test',
      level: 'info',
      code: 'TEST_EVENT',
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.timestamp).toBe(1234);
    expect(events[0]?.context?.component).toBe('audio-capture');
  });

  it('inherits context when creating child reporters', () => {
    const events: StructuredAudioEvent[] = [];
    const reporter = createStructuredEventReporter({
      transports: [event => events.push(event)],
      context: { component: 'audio-capture', sessionId: 'abc' },
      timeProvider: () => 2000,
    });

    const child = reporter.createChild({ version: '1.2.3' });
    child.emit({
      event: 'audio.capture.child',
      level: 'debug',
      code: 'CHILD_EVENT',
    });

    expect(events[0]?.context?.sessionId).toBe('abc');
    expect(events[0]?.context?.version).toBe('1.2.3');
  });

  it('invokes validation error callback when schema validation fails', () => {
    const handleValidation = vi.fn();
    const reporter = createStructuredEventReporter({
      transports: [vi.fn()],
      onValidationError: handleValidation,
    });

    reporter.emit({
      // Invalid level should trigger validation error
      event: 'audio.capture.invalid',
      level: 'info',
      code: 'lowercase-code',
    });

    expect(handleValidation).toHaveBeenCalledTimes(1);
  });
});
