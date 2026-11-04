import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LocalPrivateAttachmentStore } from './attachment.store';

describe('local private attachment store', () => {
  let root: string;
  let store: LocalPrivateAttachmentStore;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), 'expense-attachments-'));
    process.env.ATTACHMENT_LOCAL_ROOT = root;
    store = new LocalPrivateAttachmentStore();
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it('stores, retrieves, and deletes private bytes', async () => {
    const key = store.key('test-object');
    const bytes = Buffer.from('synthetic attachment');
    await store.put(key, bytes, 'application/pdf');
    await expect(readFile(join(root, key))).resolves.toEqual(bytes);
    await expect(store.get(key)).resolves.toEqual({
      bytes,
      contentType: 'application/pdf',
    });
    await store.delete(key);
    await expect(store.get(key)).rejects.toThrow();
  });

  it('rejects path traversal keys', async () => {
    await expect(store.get('../../outside')).rejects.toThrow(
      'Invalid private attachment key',
    );
  });
});
