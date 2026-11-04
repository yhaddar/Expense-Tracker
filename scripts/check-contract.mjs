import { readFile } from 'node:fs/promises';
const collection = JSON.parse(
  await readFile(
    new URL('../postman/expense-tracker.collection.json', import.meta.url),
    'utf8',
  ),
);
if (
  !collection.info?.name ||
  !Array.isArray(collection.item) ||
  collection.item.length === 0
)
  throw new Error('Invalid local API contract collection');
console.log(
  `Contract OK: ${collection.info.name} (${collection.item.length} request)`,
);
