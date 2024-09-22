import { add } from '@bablr/btree';

let leafIdx = 0;
const buildLeaf = () => ({ count: leafIdx++ });

console.log(
  JSON.stringify(
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
    undefined,
    '  ',
  ),
);
