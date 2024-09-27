import { expect } from 'expect';

import { add, pop } from '@bablr/btree';

describe('btree', () => {
  describe('add', () => {
    it('adds to a tree of size 0', () => {
      expect(add([], 'a')).toEqual(['a']);
    });

    it('adds to a tree of size 1', () => {
      expect(add(['a'], 'b')).toEqual(['a', 'b']);
    });

    it('adds to a tree of size 2', () => {
      expect(add(['a', 'b'], 'c')).toEqual([3, [['a'], ['b', 'c']]]);
    });

    it('adds to a tree of size 3', () => {
      expect(add([3, [['a'], ['b', 'c']]], 'd')).toEqual([
        4,
        [
          [2, [['a'], ['b']]],
          [2, [['c', 'd']]],
        ],
      ]);
    });

    it('adds to a tree of size 4', () => {
      expect(
        add(
          [
            4,
            [
              [2, [['a'], ['b']]],
              [2, [['c', 'd']]],
            ],
          ],
          'e',
        ),
      ).toEqual([
        5,
        [
          [2, [['a'], ['b']]],
          [3, [['c'], ['d', 'e']]],
        ],
      ]);
    });

    it('adds to a tree of size 5', () => {
      expect(
        add(
          [
            5,
            [
              [2, [['a'], ['b']]],
              [3, [['c'], ['d', 'e']]],
            ],
          ],
          'f',
        ),
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

    it('adds to a tree of size 6', () => {
      expect(
        add(
          [
            6,
            [
              [3, [['a', 'b'], ['c']]],
              [3, [['d'], ['e', 'f']]],
            ],
          ],
          'g',
        ),
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
        add(
          [
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
          ],
          'h',
        ),
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
          tree = add(tree, buildLeaf());
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

  describe('pop', () => {
    it('deletes from a tree of size 1', () => {
      expect(pop(['a'])).toEqual([]);
    });

    it('deletes from a tree of size 2', () => {
      expect(pop(['a', 'b'])).toEqual(['a']);
    });

    it('deletes from a tree of size 3', () => {
      expect(pop([3, [['a', 'b'], ['c']]])).toEqual(['a', 'b']);
    });

    it('deletes from a tree of size 4', () => {
      expect(
        pop([
          4,
          [
            ['a', 'b'],
            ['c', 'd'],
          ],
        ]),
      ).toEqual([3, [['a', 'b'], ['c']]]);
    });

    it('deletes from a tree of size 5', () => {
      expect(
        pop([
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
  });
});
