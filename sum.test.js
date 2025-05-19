function sum(a, b) {
  return a + b;
}

test('1 + 2 應該等於 3', () => {
  expect(sum(1, 2)).toBe(3);
});
