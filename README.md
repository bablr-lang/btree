# @bablr/btree

Functional utilities for working with btrees such as those used in agAST.

```js
expect(push(['a', 'b'], 'c')).toEqual([
  3,
  [['a'], ['b', 'c']],
]);

expect(addAt(0, [3, [['x'], ['y', 'z']]], 'w')).toEqual([
  4,
  [
    ['w', 'x'],
    ['y', 'z'],
  ],
]);
```
