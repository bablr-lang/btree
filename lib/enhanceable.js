import emptyStack from '@iter-tools/imm-stack';

const { isArray } = Array;
const { freeze: freezeObject, isFrozen } = Object;
const { isFinite } = Number;

export const buildModule = (NODE_SIZE = 8) => {
  const sumNodes = (nodes) => {
    return nodes.map(getSum).reduce((a, b) => a + b, 0);
  };

  const treeFrom = (...trees) => [sumNodes(trees), trees];

  const from = (...values) => {
    let tree = [];
    for (const value of values) {
      tree = push(tree, value);
    }
    return tree;
  };

  const fromValues = (values) => {
    let tree = [];
    for (const value of values) {
      tree = push(tree, value);
    }
    return tree;
  };

  const findBalancePoint = (tree) => {
    const values = isFinite(tree[0]) ? tree[1] : tree;
    let leftSum = 0;
    let rightSum = getSum(tree);
    let balance = leftSum / rightSum;

    if (!values.length) return null;
    if (values.length === 1) return 1;

    for (let i = 1; i < values.length; i++) {
      const sum = getSum(values[i - 1]);
      const lastBalance = balance;
      leftSum += sum;
      rightSum -= sum;

      balance = leftSum / rightSum;

      if (lastBalance < 1 && balance >= 1) {
        return i;
      }
    }
    return values.length - 1;
  };

  const split = (tree) => {
    const values = isFinite(tree[0]) ? tree[1] : tree;
    const isLeaf = isLeafNode(tree);

    let midIndex;

    if (isLeaf) {
      midIndex = Math.floor(values.length / 2 + 0.01);
    } else {
      midIndex = findBalancePoint(tree);
    }

    let leftValues = values.slice(0, midIndex);
    let rightValues = values.slice(midIndex);

    let left = isLeaf ? leftValues : [sumNodes(leftValues), leftValues];
    let right = isLeaf ? rightValues : [sumNodes(rightValues), rightValues];

    return { left, right };
  };

  const setValuesAt = (idx, node, value) => {
    const isLeaf = isLeafNode(node);
    const values = isLeaf ? node : node[1];

    if (!isLeaf && !isArray(value)) {
      throw new Error();
    }

    const oldSize = isLeaf ? 1 : values[idx] ? getSum(values[idx]) : 0;
    const newSize = isLeaf ? 1 : getSum(value);

    // TODO mutable sets?

    const newValues = [...values];
    newValues[idx] = value;
    freezeObject(newValues);
    return isLeaf ? newValues : freezeObject([node[0] + newSize - oldSize, newValues]);
  };

  const addAt = (idx, tree, value) => {
    if (idx < 0) throw new Error('invalid argument');
    if (!isArray(tree)) throw new Error();

    let path = findPath(idx, tree);

    let { node, index } = path.value;

    // left pushout vs right pushout?
    let pushout = value;

    let values = [...getValues(node)];

    for (;;) {
      if (pushout) {
        values = [...values];
        if (values.length + getValues(pushout).length > NODE_SIZE) {
          values.splice(index, 0, pushout);
          node = setValues(node, values);
          const { left, right } = split(node);

          pushout = left;
          node = right;
        } else {
          values.splice(index, 0, pushout);
          node = setValues(node, values);
          pushout = null;
        }
      }

      if (path.size === 1) {
        if (pushout) {
          return treeFrom(pushout, node);
        } else {
          return node;
        }
      }

      const poppedNode = node;
      path = path.pop();
      ({ node, index } = path.value);

      node = setValuesAt(index, node, poppedNode);
      values = getValues(node);
      path = path.replace({ node, index });
    }
  };

  const push = (tree, value) => {
    return addAt(getSum(tree), tree, value);
  };

  const collapses = (size) => {
    return size > NODE_SIZE / 2 + 0.01;
  };

  const nodeCollapses = (node) => {
    return collapses(getValues(node).length);
  };

  const nodeCanDonate = (node) => {
    return collapses(getValues(node).length - 1);
  };

  const pop = (tree) => {
    let path = findPath(-1, tree);

    let { node, index } = path.value;

    const initialValues = [...getValues(node)].slice(0, -1);
    let returnValue = isLeafNode(node) ? initialValues : [sumNodes(initialValues), initialValues];

    for (;;) {
      let values = getValues(returnValue);
      let adjustSibling = null;

      if (path.size > 1 && nodeCollapses(returnValue)) {
        let { node: parentNode, index: parentIndex } = path.prev.value;
        const prevSibling = getValues(parentNode)[parentIndex - 1];
        const nextSibling = getValues(parentNode)[parentIndex + 1];
        let targetSibling = nodeCanDonate(prevSibling)
          ? prevSibling
          : nodeCanDonate(nextSibling)
          ? nextSibling
          : null;
        let targetSiblingIndex = targetSibling && (prevSibling ? parentIndex - 1 : parentIndex + 1);

        if (targetSibling) {
          let targetValues = [...getValues(targetSibling)];

          const donationIdx = targetSibling === prevSibling ? targetValues.length - 1 : 0;
          const donated = targetValues[donationIdx];
          targetValues.splice(donationIdx, 1);

          adjustSibling = {
            node: setValues(targetSibling, targetValues),
            index: targetSiblingIndex,
          };

          values = [...values];

          values.splice(targetSibling === prevSibling ? values.length : 0, 0, donated);

          returnValue = setValues(returnValue, values);
        }
      }

      if (path.size === 1) {
        if (isFinite(returnValue[0]) && getSum(returnValue) <= NODE_SIZE) {
          returnValue = returnValue[1].flat();
        }
        return returnValue;
      }

      path = path.pop();
      ({ node, index } = path.value);

      values = [...getValues(node)];

      values.splice(index, 1, returnValue);

      if (adjustSibling) {
        const { index, node } = adjustSibling;
        values.splice(index, 1, ...(node ? [node] : []));
      }

      returnValue = node = setValues(node, values);
    }
  };

  const isValidNode = (node) => {
    if (!isArray(node)) return false;
    const values = isFinite(node[0]) ? node[1] : node;
    return isArray(values); //  && values.length <= NODE_SIZE;
  };

  const assertValidNode = (node) => {
    if (!isValidNode(node)) throw new Error();
    return true;
  };

  const getValues = (node) => {
    return node ? (isArray(node) ? (isFinite(node[0]) ? node[1] : node) : [node]) : [];
  };

  const setValues = (node, values) => {
    return isFinite(node[0]) ? treeFrom(...values) : values;
  };

  const isLeafNode = (node) => {
    return isArray(node) && !isFinite(node[0]);
  };

  function* traverse(tree) {
    let states = emptyStack.push({ node: tree, i: 0 });

    assertValidNode(tree);

    stack: while (states.size) {
      const s = states.value;
      const { node } = s;
      const isLeaf = isLeafNode(node);

      const values = isLeaf ? node : node[1];

      if (isLeaf) {
        for (let i = 0; i < values.length; i++) {
          yield values[i];
        }
      } else {
        for (let { i } = s; s.i < values.length; ) {
          const node = values[i];
          assertValidNode(node);
          states = states.push({ node, i: 0 });
          i = ++s.i;
          continue stack;
        }
      }
      states = states.pop();
    }
  }

  const getSum = (tree) => {
    if (tree == null) {
      return 0;
    } else if (!isArray(tree)) {
      return 1;
    } else if (isFinite(tree[0])) {
      return tree[0];
    } else {
      return tree.length;
    }
  };

  function* indexes(count, backwards = false) {
    const increment = backwards ? -1 : 1;
    for (let i = backwards ? count - 1 : 0; backwards ? i >= 0 : i < count; i += increment) {
      yield i;
    }
  }

  const findPath = (idx, tree) => {
    if (idx == null) throw new Error();

    let path = emptyStack;

    let treeSum = getSum(tree);
    let currentIdx = idx < 0 ? treeSum : 0;
    let direction = idx < 0 ? -1 : 1;
    let targetIdx = idx < 0 ? treeSum + idx : idx;

    let node = tree;
    stack: while (node) {
      assertValidNode(node);

      if (isLeafNode(node)) {
        const startIdx = idx < 0 ? currentIdx - getSum(node) : currentIdx;
        let index = isFinite(currentIdx) ? targetIdx - startIdx : currentIdx;
        if (index < 0) {
          index = -Infinity;
        } else if (index >= node.length) {
          index = Infinity;
        }
        return path.push({ index, node });
      } else {
        const values = node[1];
        let candidateNode;
        let i;

        for (i of indexes(values.length, idx < 0)) {
          candidateNode = values[i];
          const sum = getSum(candidateNode);
          const nextCount = currentIdx + sum * direction;
          if (idx < 0 ? nextCount <= targetIdx : nextCount > targetIdx || nextCount >= treeSum) {
            path = path.push({ index: i, node });
            node = candidateNode;
            continue stack;
          } else {
            currentIdx += sum * direction;
          }
        }
      }
    }

    return null;
  };

  const getAt = (idx, tree) => {
    const v = findPath(idx, tree)?.value;
    return v && v.node[v.index];
  };

  const replaceAt = (idx, tree, value) => {
    let path = findPath(idx, tree);

    if (getSum(tree) < idx) {
      throw new Error('Cannot add past the end of a list');
    } else if (getSum(tree) === idx) {
      return addAt(idx, tree, value);
    }

    let { node, index } = path.value;

    let returnValue = setValuesAt(index, node, value);

    for (;;) {
      ({ node, index } = path.value);

      if (path.size > 1) {
        path = path.pop();
        ({ node, index } = path.value);

        returnValue = setValuesAt(index, node, returnValue);
      } else {
        return returnValue;
      }
    }
  };

  const freeze = (tree) => {
    let states = emptyStack.push({ node: tree, i: 0 });

    stack: while (states.size) {
      const s = states.value;
      const { node } = s;
      const isLeaf = isLeafNode(node);

      assertValidNode(node);

      freezeObject(node);

      const values = isLeaf ? node : node[1];

      if (!isLeaf) {
        freezeObject(values);

        for (let { i } = s; s.i < values.length; ) {
          const node = values[i];
          assertValidNode(node);
          states = states.push({ node, i: 0 });
          i = ++s.i;
          continue stack;
        }
      }
      states = states.pop();
    }
    return tree;
  };

  return {
    buildModule,
    from,
    fromValues,
    findBalancePoint,
    split,
    collapses,
    nodeCollapses,
    nodeCanDonate,
    pop,
    push,
    addAt,
    isValidNode,
    assertValidNode,
    getValues,
    setValues,
    isLeafNode,
    traverse,
    getSum,
    findPath,
    getAt,
    replaceAt,
    freeze,
  };
};
