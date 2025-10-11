export type ProcessingUpdatePayload = {
  uploadId: string;
  status: string;
};

export function isProcessingUpdatePayload(
  value: unknown
): value is ProcessingUpdatePayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.uploadId === 'string' &&
    typeof candidate.status === 'string'
  );
}

export type TranscriptionStatusPayload = {
  sessionId: string;
  status: string;
};

export function isTranscriptionStatusPayload(
  value: unknown
): value is TranscriptionStatusPayload {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.sessionId === 'string' &&
    typeof candidate.status === 'string'
  );
}
