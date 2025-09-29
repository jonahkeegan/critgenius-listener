import { z } from 'zod';

export const structuredAudioEventSchema = z.object({
  event: z.string().min(1),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  code: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[A-Z0-9._-]+$/),
  timestamp: z.number().int().nonnegative(),
  operation: z.string().min(1).max(120).optional(),
  metadata: z
    .object({
      latencyMs: z.number().int().nonnegative().optional(),
      attempt: z.number().int().nonnegative().optional(),
      streamId: z.string().max(120).optional(),
      constraints: z.unknown().optional(),
    })
    .catchall(z.unknown())
    .optional(),
  context: z
    .object({
      sessionId: z.string().max(120).optional(),
      component: z.literal('audio-capture'),
      version: z.string().max(32).optional(),
    })
    .partial()
    .optional(),
});

export type StructuredAudioEvent = z.infer<typeof structuredAudioEventSchema>;
