import { BadRequestException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { ApiExceptionFilter } from './api-exception.filter';

function replySpy() {
  const sent: {
    status?: number;
    body?: unknown;
    headers: Record<string, string>;
  } = { headers: {} };
  return {
    sent,
    reply: {
      header(name: string, value: string) {
        sent.headers[name] = value;
      },
      status(code: number) {
        sent.status = code;
        return {
          send(body: unknown) {
            sent.body = body;
          },
        };
      },
    },
  };
}

describe('ApiExceptionFilter', () => {
  it('returns the documented safe envelope for client errors', () => {
    const spy = replySpy();
    new ApiExceptionFilter().catch(
      new BadRequestException('Input is invalid'),
      {
        switchToHttp: () => ({
          getResponse: () => spy.reply,
          getRequest: () => ({ id: 'req-1' }),
        }),
      } as never,
    );
    expect(spy.sent.status).toBe(400);
    expect(spy.sent.headers['x-request-id']).toBe('req-1');
    expect(spy.sent.body).toEqual({
      code: 'HTTP_400',
      message: 'Input is invalid',
      requestId: 'req-1',
      retryable: false,
    });
  });

  it('does not expose internal exception details', () => {
    const spy = replySpy();
    new ApiExceptionFilter().catch(
      new Error('database password and SQL details'),
      {
        switchToHttp: () => ({
          getResponse: () => spy.reply,
          getRequest: () => ({ id: 'req-2' }),
        }),
      } as never,
    );
    expect(spy.sent.status).toBe(500);
    expect(spy.sent.body).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected server error occurred',
      requestId: 'req-2',
      retryable: true,
    });
  });
});
