import { expect } from 'expect';

import { add } from '@bablr/btree';

let leafIdx = 0;
const buildLeaf = () => Object.freeze({ count: leafIdx++ });

describe('btree', () => {
  beforeEach(() => {
    leafIdx = 0;
  });

  describe('add', () => {
    it('splits a leaf node in half', () => {
      expect(add([buildLeaf(), buildLeaf()], buildLeaf())).toEqual([
        3,
        [[{ count: 0 }], [{ count: 1 }, { count: 2 }]],
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
          [{ count: 0 }, { count: 1 }],
          [3, [[{ count: 2 }], [{ count: 3 }, { count: 4 }]]],
        ],
      ]);
    });
  });
});
