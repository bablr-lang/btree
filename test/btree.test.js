import { expect } from 'expect';

import { add } from '@bablr/btree';

const sym = Symbol.for;

let leafIdx = 0;
const buildLeaf = () => sym(leafIdx++);

describe('btree', () => {
  beforeEach(() => {
    leafIdx = 0;
  });

  describe('add', () => {
    it('creates a new tree', () => {
      expect(add([], buildLeaf())).toEqual([sym(0)]);
    });

    it('splits a leaf node in half', () => {
      expect(add([buildLeaf(), buildLeaf()], buildLeaf())).toEqual([
        3,
        [[sym(0)], [sym(1), sym(2)]],
      ]);
    });

    it('self balances', () => {
      expect(add([[buildLeaf()], [buildLeaf(), buildLeaf()]], buildLeaf())).toEqual([
        4,
        [[sym(0)], [sym(1)], [sym(2), sym(3)]],
      ]);
    });

    it('splits a branch node in half', () => {
      expect(
        add(
          [
            4,
            [
              [buildLeaf(), buildLeaf()],
              [buildLeaf(), buildLeaf()],
            ],
          ],
          buildLeaf(),
        ),
      ).toEqual([
        5,
        [
          [sym(0), sym(1)],
          [3, [[sym(2)], [sym(3), sym(4)]]],
        ],
      ]);
    });

    it.skip('builds a tree', () => {
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
      ).toEqual([]);
    });
  });
});
