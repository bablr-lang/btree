# @bablr/btree

This library offers a set of functional utilities for working with immutable btrees such as those used in agAST.

```js
import * as btree from '@bablr/btree';

let tree = btree.fromValues([]);
tree = btree.push('a');
tree = btree.push('b');
tree = btree.push('c');
let tree3 = tree;
tree = btree.concat(tree, tree);
tree = btree.concat(tree3, tree);

btree.getSize(tree); // 9
btree.getAt(-2, tree); // 'b'
[...btree.traverse(tree)]; // ['a', 'b', 'c', 'a', 'b', 'c', 'a', 'b', 'c']
```
