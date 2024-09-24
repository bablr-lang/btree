import emptyStack from '@iter-tools/imm-stack';

const { isArray } = Array;
const { freeze: freezeObject, isFrozen } = Object;
const { isFinite } = Number;

const NODE_SIZE = 2;

const sumNodes = (nodes) => {
  return nodes.map(getSum).reduce((a, b) => a + b, 0);
};

export const treeFrom = (...trees) => [sumNodes(trees), trees];

export const findBalancePoint = (tree) => {
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

export const split = (tree) => {
  const values = isFinite(tree[0]) ? tree[1] : tree;
  const isLeaf = isLeafNode(tree);

  let midIndex;

  if (isLeaf) {
    midIndex = Math.floor(values.length / 2);
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

export const add = (tree, value) => {
  let path = findPath(-1, tree);

  if (!path) {
    return [value];
  }

  let { node, index } = path.value;

  const newNode = setValuesAt(getValues(node).length, node, value);
  path = path.replace({ index, node: newNode });

  let returnValue = newNode;

  for (;;) {
    ({ node, index } = path.value);
    const isLeaf = isLeafNode(node);

    if (path.size > 1) {
      path = path.pop();
      ({ node, index } = path.value);

      let values = [...getValues(node)];

      if (getValues(returnValue).length > NODE_SIZE) {
        const { left, right } = split(returnValue);
        values.splice(index, 1, left, right);
      } else {
        values.splice(index, 1, returnValue);
      }

      node = isLeafNode(node) ? values : [sumNodes(values), values];
      returnValue = node;

      path = path.replace({ index, node });
    } else {
      if (getValues(returnValue).length > NODE_SIZE) {
        const { left, right } = split(returnValue);
        returnValue = treeFrom(left, right);
      }

      return returnValue;
    }
  }
};

// export const add = (tree, value) => addAt(0, tree, value);

export const isValidNode = (node) => {
  if (!isArray(node)) return false;
  const values = isFinite(node[0]) ? node[1] : node;
  return isArray(values) && values.length <= NODE_SIZE;
};

export const assertValidNode = (node) => {
  if (!isValidNode(node)) throw new Error();
  return true;
};

export const getValues = (node) => {
  return isArray(node) ? (isFinite(node[0]) ? node[1] : node) : null;
};

export const isLeafNode = (node) => {
  return isArray(node) && !isFinite(node[0]);
};

export function* traverse(tree) {
  let states = emptyStack.push({ node: tree, i: 0 });

  stack: while (states.size) {
    const s = states.value;
    const { node } = s;
    const isLeaf = isLeafNode(node);

    assertValidNode(node);

    const values = isLeaf ? node : node[1];

    if (isLeaf) {
      for (let i = 0; i < values.length; i++) {
        yield values[i];
      }
    } else {
      for (; s.i < values.length; s.i++) {
        states = states.push({ node: values[s.i], i: 0 });
        continue stack;
      }
    }
    states = states.pop();
  }
}

export const getSum = (tree) => {
  if (!isArray(tree)) {
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

export const findPath = (idx, tree) => {
  let path = emptyStack;

  let treeSum = getSum(tree);
  let currentIdx = idx < 0 ? treeSum : 0;
  let direction = idx < 0 ? -1 : 1;
  let targetIdx = idx < 0 ? currentIdx + idx : idx;

  if (targetIdx < 0 || targetIdx >= treeSum) return null;

  let node = tree;
  stack: while (node) {
    assertValidNode(node);

    if (isLeafNode(node)) {
      return path.push({ index: currentIdx - targetIdx, node });
    } else {
      const values = node[1];
      for (const i of indexes(values.length, idx < 0)) {
        const candidateNode = values[i];
        const sum = getSum(candidateNode);
        const nextCount = currentIdx + sum * direction;
        if (idx < 0 ? nextCount <= targetIdx : nextCount >= targetIdx) {
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

export const getAt = (idx, tree) => {
  let node = tree;
  let currentIdx = idx < 0 ? getSum(tree) : 0;
  let direction = idx < 0 ? -1 : 1;
  let targetIdx = idx < 0 ? currentIdx + idx : idx;

  stack: while (node) {
    assertValidNode(node);

    if (isLeafNode(node)) {
      return node[targetIdx - currentIdx];
    } else {
      const values = node[1];
      for (const i of indexes(values.length, idx < 0)) {
        const candidateNode = values[i];
        const sum = getSum(candidateNode);
        const nextCount = currentIdx + sum * direction;
        if (idx < 0 ? nextCount <= targetIdx : nextCount >= targetIdx) {
          node = candidateNode;
          break stack;
        } else {
          currentIdx += sum * direction;
        }
      }
    }
  }
  return null;
};

export const freeze = (tree) => {
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

      for (let i = 0; i < values.length; i++) {
        states = states.push({ node: values[s.i], i: 0 });
        continue stack;
      }
    }
    states = states.pop();
  }
};
