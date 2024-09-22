# @bablr/btree

Functional utilities for working with btrees such as those used in agAST. These trees could also correctly be termed sum trees, and are represented as:

```js
let leafNode = [...data];

let branchNode = [sum, [...nodes]];

let tree = [3, [[node1, node2], [node3]]];
```

You can differentiate non-leaf nodes because they have a number as their first element. This is possible the data stored in this tree will always be object-typed.
