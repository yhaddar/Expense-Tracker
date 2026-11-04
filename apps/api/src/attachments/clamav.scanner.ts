import net from 'node:net';
import { ServiceUnavailableException } from '@nestjs/common';

export type ScanResult = 'clean' | 'infected';

export function parseClamAvResult(response: string): ScanResult {
  const normalized = response.replace(/\0/g, '').trim();
  if (normalized.endsWith('FOUND')) return 'infected';
  if (normalized.endsWith('OK')) return 'clean';
  throw new ServiceUnavailableException(
    'ClamAV returned an unknown scan result',
  );
}

export interface AttachmentScanner {
  scan(bytes: Buffer): Promise<ScanResult>;
}

export class ClamAvScanner implements AttachmentScanner {
  private readonly host = process.env.CLAMAV_HOST ?? '127.0.0.1';
  private readonly port = Number(process.env.CLAMAV_PORT ?? 3310);
  private readonly timeoutMs = Number(process.env.CLAMAV_TIMEOUT_MS ?? 15_000);

  scan(bytes: Buffer): Promise<ScanResult> {
    return new Promise((resolve, reject) => {
      const socket = net.createConnection({ host: this.host, port: this.port });
      const chunks: Buffer[] = [];
      let settled = false;
      const fail = (error: unknown) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        reject(
          error instanceof ServiceUnavailableException
            ? error
            : new ServiceUnavailableException('ClamAV scan is unavailable'),
        );
      };
      socket.setTimeout(this.timeoutMs, () =>
        fail(new Error('ClamAV timeout')),
      );
      socket.on('error', fail);
      socket.on('data', (chunk: Buffer) => chunks.push(chunk));
      socket.on('end', () => {
        if (settled) return;
        settled = true;
        try {
          resolve(parseClamAvResult(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(error);
        }
      });
      socket.on('connect', () => {
        const header = Buffer.from('zINSTREAM\\0', 'ascii');
        const length = Buffer.alloc(4);
        length.writeUInt32BE(bytes.length, 0);
        socket.write(header);
        socket.write(length);
        socket.write(bytes);
        socket.end(Buffer.from([0, 0, 0, 0]));
      });
    });
  }
}
