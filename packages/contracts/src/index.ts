export type ApiError = {
  code: string;
  message: string;
  requestId: string;
  retryable: boolean;
  fields?: Record<string, string[]>;
};
export type HealthResponse = { status: 'ok'; service: string; version: 'v1' };
