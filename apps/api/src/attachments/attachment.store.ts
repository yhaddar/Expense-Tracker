import {
  GetObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { Injectable, ServiceUnavailableException } from '@nestjs/common';

export type AttachmentObject = {
  bytes: Buffer;
  contentType: string;
};

export interface PrivateAttachmentStore {
  key(id: string): string;
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<AttachmentObject>;
  delete(key: string): Promise<void>;
}

@Injectable()
export class S3PrivateAttachmentStore implements PrivateAttachmentStore {
  private readonly bucket = process.env.AWS_S3_BUCKET;
  private readonly prefix = (
    process.env.AWS_S3_PREFIX ?? 'expense-tracker/attachments'
  ).replace(/\/$/, '');
  private readonly client = new S3Client({
    region: process.env.AWS_REGION ?? 'eu-west-1',
  });

  private requireBucket(): string {
    if (!this.bucket)
      throw new ServiceUnavailableException(
        'Private attachment storage is not configured',
      );
    return this.bucket;
  }

  key(id: string): string {
    return `${this.prefix}/${id}`;
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.requireBucket(),
        Key: key,
        Body: bytes,
        ContentType: contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
  }

  async get(key: string): Promise<AttachmentObject> {
    const result = await this.client.send(
      new GetObjectCommand({ Bucket: this.requireBucket(), Key: key }),
    );
    if (!result.Body)
      throw new ServiceUnavailableException('Attachment object is empty');
    return {
      bytes: Buffer.from(await result.Body.transformToByteArray()),
      contentType: result.ContentType ?? 'application/octet-stream',
    };
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: this.requireBucket(), Key: key }),
    );
  }
}

/** Local-only adapter for isolated development/test runs; production remains S3. */
export class LocalPrivateAttachmentStore implements PrivateAttachmentStore {
  private readonly root = process.env.ATTACHMENT_LOCAL_ROOT;
  private readonly prefix = 'expense-tracker/attachments';

  private requireRoot(): string {
    if (!this.root || !isAbsolute(this.root))
      throw new ServiceUnavailableException(
        'Local attachment storage requires an absolute ATTACHMENT_LOCAL_ROOT',
      );
    return resolve(this.root);
  }

  key(id: string): string {
    return `${this.prefix}/${id}`;
  }

  private pathFor(key: string): string {
    const root = this.requireRoot();
    const path = resolve(root, key);
    const relativePath = relative(root, path);
    if (relativePath.startsWith('..') || isAbsolute(relativePath))
      throw new ServiceUnavailableException('Invalid private attachment key');
    return path;
  }

  async put(key: string, bytes: Buffer, contentType: string): Promise<void> {
    const path = this.pathFor(key);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes, { flag: 'wx' });
    await writeFile(`${path}.content-type`, contentType, { flag: 'wx' });
  }

  async get(key: string): Promise<AttachmentObject> {
    const path = this.pathFor(key);
    return {
      bytes: await readFile(path),
      contentType: await readFile(`${path}.content-type`, 'utf8'),
    };
  }

  async delete(key: string): Promise<void> {
    const path = this.pathFor(key);
    await rm(path, { force: false });
    await rm(`${path}.content-type`, { force: true });
  }
}
