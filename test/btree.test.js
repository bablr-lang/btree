import { expect } from 'expect';

import { buildModule } from '@bablr/btree/enhanceable';

const { push, removeAt, addAt, concat } = buildModule(2);

describe.skip('btree of node size 2', () => {
  describe('push', () => {
    it('appends to a tree of size 0', () => {
      expect(push('a', [])).toEqual(['a']);
    });

    it('appends to a tree of size 1', () => {
      expect(push('b', ['a'])).toEqual(['a', 'b']);
    });

    it('appends to a tree of size 2', () => {
      expect(push('c', ['a', 'b'])).toEqual([3, [['a'], ['b', 'c']]]);
    });

    it('appends to a tree of size 3', () => {
      expect(push('d', [3, [['a'], ['b', 'c']]])).toEqual([
        4,
        [
          [2, [['a'], ['b']]],
          [2, [['c', 'd']]],
        ],
      ]);
    });

    it('appends to a tree of size 4', () => {
      expect(
        push('e', [
          4,
          [
            [2, [['a'], ['b']]],
            [2, [['c', 'd']]],
          ],
        ]),
      ).toEqual([
        5,
        [
          [2, [['a'], ['b']]],
          [3, [['c'], ['d', 'e']]],
        ],
      ]);
    });

    it('appends to a tree of size 5', () => {
      expect(
        push('f', [
          5,
          [
            [2, [['a'], ['b']]],
            [3, [['c'], ['d', 'e']]],
          ],
        ]),
      ).toEqual([
        6,
        [
          [
            4,
            [
              [2, [['a'], ['b']]],
              [2, [['c'], ['d']]],
            ],
          ],
          [2, [[2, [['e', 'f']]]]],
        ],
      ]);
    });

    it('appends to a tree of size 6', () => {
      expect(
        push('g', [
          6,
          [
            [3, [['a', 'b'], ['c']]],
            [3, [['d'], ['e', 'f']]],
          ],
        ]),
      ).toEqual([
        7,
        [
          [
            5,
            [
              [3, [['a', 'b'], ['c']]],
              [2, [['d'], ['e']]],
            ],
          ],
          [2, [[2, [['f', 'g']]]]],
        ],
      ]);
    });

    it('adds to a tree of size 7', () => {
      expect(
        push('h', [
          7,
          [
            [
              5,
              [
                [3, [['a', 'b'], ['c']]],
                [2, [['d'], ['e']]],
              ],
            ],
            [2, [[2, [['f', 'g']]]]],
          ],
        ]),
      ).toEqual([
        8,
        [
          [
            5,
            [
              [3, [['a', 'b'], ['c']]],
              [2, [['d'], ['e']]],
            ],
          ],
          [3, [[3, [['f'], ['g', 'h']]]]],
        ],
      ]);
    });

    it('builds a tree of size 11', () => {
      let leaf = 'a'.charCodeAt(0);
      const buildLeaf = () => {
        return String.fromCharCode(leaf++);
      };

      const addNodes = (n) => {
        let tree = [];
        for (let i = 0; i < n; i++) {
          tree = push(buildLeaf(), tree);
        }
        return tree;
      };

      expect(addNodes(11)).toEqual([
        11,
        [
          [
            8,
            [
              [
                4,
                [
                  [
                    4,
                    [
                      [2, [['a'], ['b']]],
                      [2, [['c'], ['d']]],
                    ],
                  ],
                ],
              ],
              [
                4,
                [
                  [2, [[2, [['e'], ['f']]]]],
                  [2, [[2, [['g'], ['h']]]]],
                ],
              ],
            ],
          ],
          [3, [[3, [[3, [[3, [['i'], ['j', 'k']]]]]]]]],
        ],
      ]);
    });
  });

  describe('concat', () => {
    it('concats 2 trees of size 1', () => {
      expect(concat([1, ['a']], [1, ['b']])).toEqual(['a', 'b']);
    });

    it('concats tree with empty tree', () => {
      expect(concat([1, ['a']], [])).toEqual([1, ['a']]);
    });

    it('concats 2 trees of unequal height', () => {
      expect(
        concat(
          [1, ['a']],
          [
            2,
            [
              [1, ['b']],
              [1, ['c']],
            ],
          ],
        ),
      ).toEqual([
        3,
        [
          [
            2,
            [
              [1, ['a']],
              [1, ['b']],
            ],
          ],
          [1, [[1, ['c']]]],
        ],
      ]);
    });

    it('concats 2 trees of height 2', () => {
      expect(
        concat(
          [
            2,
            [
              [1, ['a']],
              [1, ['b']],
            ],
          ],
          [
            2,
            [
              [1, ['c']],
              [1, ['d']],
            ],
          ],
        ),
      ).toEqual([
        4,
        [
          [
            2,
            [
              [1, ['a']],
              [1, ['b']],
            ],
          ],
          [
            2,
            [
              [1, ['c']],
              [1, ['d']],
            ],
          ],
        ],
      ]);
    });
  });

  describe('unshift', () => {
    it('prepends to a tree of size 0', () => {
      expect(addAt(0, 'z', [])).toEqual(['z']);
    });

    it('prepends to a tree of size 1', () => {
      expect(addAt(0, 'y', ['z'])).toEqual(['y', 'z']);
    });

    it('prepends to a tree of size 2', () => {
      expect(addAt(0, 'x', ['y', 'z'])).toEqual([3, [['x'], ['y', 'z']]]);
    });

    it('prepends to a tree of size 3', () => {
      expect(addAt(0, 'w', [3, [['x'], ['y', 'z']]])).toEqual([
        4,
        [
          ['w', 'x'],
          ['y', 'z'],
        ],
      ]);
    });

    it('prepends to a tree of size 4', () => {
      expect(
        addAt(0, 'v', [
          4,
          [
            ['w', 'x'],
            ['y', 'z'],
          ],
        ]),
      ).toEqual([
        5,
        [
          [3, [['v'], ['w', 'x']]],
          [2, [['y', 'z']]],
        ],
      ]);
    });

    it('prepends to a tree of size 5', () => {
      expect(
        addAt(0, 'u', [
          5,
          [
            [3, [['v'], ['w', 'x']]],
            [2, [['y', 'z']]],
          ],
        ]),
      ).toEqual([
        6,
        [
          [
            4,
            [
              ['u', 'v'],
              ['w', 'x'],
            ],
          ],
          [2, [['y', 'z']]],
        ],
      ]);
    });

    it('prepends to a tree of size 6', () => {
      expect(
        addAt(0, 't', [
          6,
          [
            [
              4,
              [
                ['u', 'v'],
                ['w', 'x'],
              ],
            ],
            [2, [['y', 'z']]],
          ],
        ]),
      ).toEqual([
        7,
        [
          [
            5,
            [
              [3, [['t'], ['u', 'v']]],
              [2, [['w', 'x']]],
            ],
          ],
          [2, [[2, [['y', 'z']]]]],
        ],
      ]);
    });

    it('prepends to a tree of size 7', () => {
      expect(
        addAt(0, 's', [
          7,
          [
            [
              5,
              [
                [3, [['t'], ['u', 'v']]],
                [2, [['w', 'x']]],
              ],
            ],
            [2, [[2, [['y', 'z']]]]],
          ],
        ]),
      ).toEqual([
        8,
        [
          [
            6,
            [
              [
                4,
                [
                  ['s', 't'],
                  ['u', 'v'],
                ],
              ],
              [2, [['w', 'x']]],
            ],
          ],
          [2, [[2, [['y', 'z']]]]],
        ],
      ]);
    });
  });

  describe('removeAt', () => {
    it('removes from a tree of size 1', () => {
      expect(removeAt(-1, ['a'])).toEqual([]);
    });

    it('removes from a tree of size 2', () => {
      expect(removeAt(-1, ['a', 'b'])).toEqual(['a']);
    });

    it('removes from a tree of size 3', () => {
      expect(removeAt(-1, [3, [['a', 'b'], ['c']]])).toEqual(['a', 'b']);
    });

    it('removes from a tree of size 4', () => {
      expect(
        removeAt(-1, [
          4,
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
        ]),
      ).toEqual([3, [['a', 'b'], ['c']]]);
    });

    it('removes from the middle of a tree of size 4', () => {
      expect(
        removeAt(0, [
          4,
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
        ]),
      ).toEqual([3, [['b'], ['c', 'd']]]);
      expect(
        removeAt(1, [
          4,
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
        ]),
      ).toEqual([3, [['a'], ['c', 'd']]]);

      expect(
        removeAt(2, [
          4,
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
        ]),
      ).toEqual([3, [['a', 'b'], ['d']]]);

      expect(removeAt(3, [4, [['a', 'b'], ['c']]])).toEqual([3, [['a', 'b'], ['c']]]);
    });

    it('removes from a tree of size 5', () => {
      expect(
        removeAt(-1, [
          5,
          [
            [3, [['a', 'b'], ['c']]],
            [2, [['d', 'e']]],
          ],
        ]),
      ).toEqual([
        4,
        [
          [3, [['a', 'b'], ['c']]],
          [1, [['d']]],
        ],
      ]);
    });

    it('removes first from a tree of size 5', () => {
      expect(
        removeAt(0, [
          5,
          [
            [3, [['a', 'b'], ['c']]],
            [2, [['d', 'e']]],
          ],
        ]),
      ).toEqual([
        4,
        [
          [2, [['b'], ['c']]],
          [2, [['d', 'e']]],
        ],
      ]);
    });

    describe('sad path', () => {
      it('Errors on invalid index', () => {
        expect(() => {
          removeAt(30, [
            6,
            [
              [3, [['a', 'b'], ['c']]],
              [3, [['d', 'e'], ['f']]],
            ],
          ]);
        }).toThrowError('Index exceeds tree bounds');
      });
    });
  });
});
