import { expect } from 'expect';

import { add } from '@bablr/btree';

describe('btree', () => {
  describe('add', () => {
    it('creates a new tree', () => {
      expect(add([], 'a')).toEqual(['a']);
    });

    it('splits a leaf node in half', () => {
      expect(add(['a', 'b'], 'c')).toEqual([3, [['a'], ['b', 'c']]]);
    });

    it('self balances', () => {
      expect(add([3, [['a'], ['b', 'c']]], 'd')).toEqual([
        4,
        [
          [2, [['a'], ['b']]],
          [2, [['c', 'd']]],
        ],
      ]);
    });

    it('splits a branch node in half', () => {
      expect(
        add(
          [
            4,
            [
              ['a', 'b'],
              ['c', 'd'],
            ],
          ],
          'e',
        ),
      ).toEqual([
        5,
        [
          [3, [['a', 'b'], ['c']]],
          [2, [['d', 'e']]],
        ],
      ]);
    });

    it('adds more stuff', () => {
      expect(
        add(
          [
            5,
            [
              [3, [['a', 'b'], ['c']]],
              [2, [['d', 'e']]],
            ],
          ],
          'f',
        ),
      ).toEqual([
        6,
        [
          [3, [['a', 'b'], ['c']]],
          [3, [['d'], ['e', 'f']]],
        ],
      ]);
    });

    it('adds stuff three levels deep', () => {
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

    it('builds a tree', () => {
      let leaf = 'a'.charCodeAt(0);
      const buildLeaf = () => {
        return String.fromCharCode(leaf++);
      };

      expect(
        add(
          add(
            add(
              add(
                add(
                  add(
                    add(
                      add(add(add(add([], buildLeaf()), buildLeaf()), buildLeaf()), buildLeaf()),
                      buildLeaf(),
                    ),
                    buildLeaf(),
                  ),
                  buildLeaf(),
                ),
                buildLeaf(),
              ),
              buildLeaf(),
            ),
            buildLeaf(),
          ),
          buildLeaf(),
        ),
      ).toEqual([
        11,
        [
          [
            8,
            [
              [
                4,
                [
                  [2, [['a'], ['b']]],
                  [2, [['c'], ['d']]],
                ],
              ],
              [
                4,
                [
                  [2, [['e'], ['f']]],
                  [2, [['g'], ['h']]],
                ],
              ],
            ],
          ],
          [3, [[3, [[3, [['i'], ['j', 'k']]]]]]],
        ],
      ]);
    });
  });
});
