const randomAnimals = [
  'chipmunks',
  'crocodile',
  'elephant',
  'goat',
  'kangaroo',
  'lion',
  'monkey',
  'panda',
  'penguin',
  'polar bear',
  'snake',
  'snow leopard',
  'tiger',
  'liger',
];

export function getRandomActionName(): string {
  return randomAnimals[Math.floor(Math.random() * randomAnimals.length)];
}
