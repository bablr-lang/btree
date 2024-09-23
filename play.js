import { add } from '@bablr/btree';

let leaf = 'a'.charCodeAt(0);
const buildLeaf = () => {
  return String.fromCharCode(leaf++);
};

console.log(
  JSON.stringify(
    add([3, [[buildLeaf()], [buildLeaf(), buildLeaf()]]], buildLeaf()),
    undefined,
    '  ',
  ),
);
