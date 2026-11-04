import { randomUUID } from 'node:crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

type ErrorReply = {
  header(name: string, value: string): void;
  status(code: number): { send(body: unknown): void };
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<ErrorReply>();
    const request = host.switchToHttp().getRequest<{ id?: string }>();
    const requestId = request.id ?? randomUUID();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw =
      exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof raw === 'string'
        ? raw
        : raw && typeof raw === 'object' && 'message' in raw
          ? (raw as { message?: unknown }).message
          : undefined;
    const safeMessage =
      status >= 500
        ? 'An unexpected server error occurred'
        : Array.isArray(message)
          ? message.join('; ')
          : typeof message === 'string'
            ? message
            : 'Request failed';
    response.header('x-request-id', requestId);
    response.status(status).send({
      code: status >= 500 ? 'INTERNAL_SERVER_ERROR' : `HTTP_${status}`,
      message: safeMessage,
      requestId,
      retryable: status >= 500 || status === HttpStatus.TOO_MANY_REQUESTS,
    });
  }
}
