import { expect, test } from 'vitest';
import { uuidv4 } from './uuid';

const regexV4 =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const COUNT = 10000;

test('Validate v4 uuid for many times', () => {
  const set = new Set();

  for (let i = 0; i < COUNT; i++) {
    const uuid = uuidv4();
    set.add(uuid);
    expect(uuid).toMatch(regexV4);
  }

  expect(set.size).toEqual(COUNT);
});
