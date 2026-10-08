import test from 'node:test';
import assert from 'node:assert/strict';

import { createProductSchema } from './productValidator';

test('accepts imageUrl as a single URL', () => {
  const result = createProductSchema.parse({
    productName: 'YAM',
    quantityKg: 10,
    imageUrl: 'https://ik.imagekit.io/demo/test.jpg',
  });

  assert.deepEqual(result.images, ['https://ik.imagekit.io/demo/test.jpg']);
});

test('accepts a single string in images', () => {
  const result = createProductSchema.parse({
    productName: 'YAM',
    quantityKg: 10,
    images: 'https://ik.imagekit.io/demo/test.jpg',
  });

  assert.deepEqual(result.images, ['https://ik.imagekit.io/demo/test.jpg']);
});
