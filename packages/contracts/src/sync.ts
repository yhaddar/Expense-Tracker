export type SyncOperationState =
  | 'queued'
  | 'sent'
  | 'accepted'
  | 'conflict'
  | 'retryable_failure'
  | 'permanent_failure';

export type SyncMetadata = {
  operationId: string;
  aggregateId: string;
  baseVersion: bigint;
  schemaVersion: string;
  clientCreatedAt: string;
};

export type ConflictMetadata = {
  aggregateId: string;
  serverVersion: bigint;
  attemptedOperationId: string;
  resolutionState: 'unresolved';
};
