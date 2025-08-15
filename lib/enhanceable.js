import emptyStack from '@iter-tools/imm-stack';

const { isArray } = Array;
const { freeze } = Object;
const { isFinite } = Number;

export const defaultNodeSize = 8;

export const deepFreeze = (object) => {
  let list = emptyStack.push(object);
  while (list.size) {
    let item = list.value;
    list = list.pop();

    for (const value of Object.values(item)) {
      if (value && typeof value === 'object') {
        if (
          !(Array.isArray(value) || [Object.prototype, null].includes(Object.getPrototypeOf(value)))
        )
          throw new Error();
        list = list.push(value);
      }
    }

    Object.freeze(item);
  }
  return object;
};

export const buildModule = (NODE_SIZE = defaultNodeSize, buildStats) => {
  const sumNodes = (nodes) => {
    return nodes.map(getSize).reduce((a, b) => a + b, 0);
  };

  const getHeight = (tree) => {
    let height = 0;
    let node = tree;

    while (Array.isArray(node)) {
      height++;
      node = getValues(node)[0];
    }

    return height;
  };

  const treeFrom = (...values) => {
    if (!buildStats && values.length <= NODE_SIZE) {
      return freeze(values);
    } else {
      let tree = [];
      for (const value of values) {
        tree = push(tree, value);
      }
      return tree;
    }
  };

  const treeFromValues = (values) => {
    if (values.includes(undefined)) throw new Error();
    if (!buildStats && values.length <= NODE_SIZE) {
      return isArray(values[0]) ? freeze([sumNodes(values), freeze(values)]) : freeze(values);
    } else {
      if (values.length <= NODE_SIZE) {
        if (buildStats) {
          return freeze([sumNodes(values), freeze(values), buildStats(values)]);
        } else {
          return freeze([sumNodes(values), freeze(values)]);
        }
      } else {
        throw new Error();
      }
    }
  };

  const findBalancePoint = (values) => {
    let leftSum = 0;
    let rightSum = values.reduce((sum, v) => sum + getSize(v), 0);
    let balance = leftSum / rightSum;

    if (!values.length) return null;
    if (values.length === 1) return 1;

    for (let i = 1; i < values.length; i++) {
      const sum = getSize(values[i - 1]);
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

  const splitValues = (values) => {
    const isLeaf = !isArray(values[0]);

    let midIndex;

    if (isLeaf) {
      midIndex = Math.floor(values.length / 2 + 0.01);
    } else {
      midIndex = findBalancePoint(values);
    }

    let leftValues = values.slice(0, midIndex);
    let rightValues = values.slice(midIndex);

    return { leftValues, rightValues };
  };

  const setValuesAt = (idx, node, value) => {
    const values = getValues(node);

    if (!Number.isFinite(idx)) throw new Error();

    if (!value == null) {
      throw new Error();
    }

    const newValues = values.slice();
    newValues[idx] = value;
    return treeFromValues(newValues);
  };

  const concat = (first, second) => {
    if (!isArray(first) || !isArray(second)) throw new Error();

    let firstHeight = getHeight(first);
    let secondHeight = getHeight(second);
    let firstValues = getValues(first);
    let secondValues = getValues(second);

    if (firstHeight === secondHeight) {
      if (firstValues.length + secondValues.length < NODE_SIZE) {
        return treeFromValues([...firstValues, ...secondValues]);
      } else {
        return treeFromValues([first, second]);
      }
    } else {
      let targetDepth = Math.abs(firstHeight - secondHeight);
      let path =
        firstHeight > secondHeight
          ? findPath(Infinity, first, targetDepth)
          : findPath(0, second, targetDepth);

      let { node, index } = path.value;

      let pushout = firstHeight > secondHeight ? second : first;

      let values = getValues(node);

      for (;;) {
        if (pushout) {
          values = values.slice();

          let finiteIndex = index === Infinity ? values.length : index;

          if (!isFinite(finiteIndex)) throw new Error();
          if (values.length + getValues(pushout).length > NODE_SIZE) {
            values.splice(finiteIndex, 0, pushout);
            const { leftValues, rightValues } = splitValues(values);

            pushout = treeFromValues(leftValues);
            node = treeFromValues(rightValues);
          } else {
            values.splice(finiteIndex, 0, pushout);
            node = setValues(node, values);
            pushout = null;
          }
        }

        if (path.size === 1) {
          if (pushout) {
            return treeFromValues([pushout, node]);
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
    }
  };

  const addAt = (idx, tree, value) => {
    if (idx < 0 || !Number.isFinite(idx)) throw new Error('invalid argument');
    if (!isArray(tree)) throw new Error();
    if (!value) throw new Error();

    let path = findPath(idx, tree);

    let { node, index } = path.value;

    let pushout = value;

    let values = getValues(node);

    for (;;) {
      if (pushout) {
        values = values.slice();

        let finiteIndex = index === Infinity ? values.length : index;

        if (!isFinite(finiteIndex)) throw new Error();
        if (values.length + getValues(pushout).length > NODE_SIZE) {
          values.splice(finiteIndex, 0, pushout);
          const { leftValues, rightValues } = splitValues(values);

          pushout = treeFromValues(leftValues);
          node = treeFromValues(rightValues);
        } else {
          values.splice(finiteIndex, 0, pushout);
          node = setValues(node, values);
          pushout = null;
        }
      }

      if (path.size === 1) {
        if (pushout) {
          return treeFromValues([pushout, node]);
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
    let size = getSize(tree);
    return size ? addAt(size, tree, value) : treeFromValues([value]);
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

  const removeAt = (idx, tree) => {
    let path = findPath(idx, tree);

    let { node, index } = path.value;

    const initialValues = [...getValues(node)];

    initialValues.splice(index, 1);

    let returnValue = !isFinite(node[0]) ? initialValues : treeFromValues(initialValues);

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
          let targetValues = getValues(targetSibling).slice();

          const donationIdx = targetSibling === prevSibling ? targetValues.length - 1 : 0;
          const donated = targetValues[donationIdx];
          targetValues.splice(donationIdx, 1);

          adjustSibling = {
            node: setValues(targetSibling, targetValues),
            index: targetSiblingIndex,
          };

          values = values.slice();

          values.splice(targetSibling === prevSibling ? values.length : 0, 0, donated);

          returnValue = setValues(returnValue, values);
        }
      }

      if (path.size === 1) {
        if (getSize(returnValue) <= NODE_SIZE) {
          returnValue = setValues(returnValue, getValues(returnValue).flat());
        }
        return returnValue;
      }

      path = path.pop();
      ({ node, index } = path.value);

      values = getValues(node).slice();

      values.splice(index, 1, returnValue);

      if (adjustSibling) {
        const { index, node } = adjustSibling;
        if (node) {
          values.splice(index, 1, node);
        } else {
          values.splice(index, 1);
        }
      }

      returnValue = node = setValues(node, values);
    }
  };

  const pop = (tree) => {
    return removeAt(-1, tree);
  };

  const isValidNode = (node) => {
    if (!isArray(node)) return false;
    const values = getValues(node);
    if (!isArray(values) || values.length > NODE_SIZE) return false; //  ;

    return !node[0] || isFinite(node[0]) || ['object', 'string'].includes(typeof node[0]);
  };

  const assertValidNode = (node) => {
    if (!isValidNode(node)) throw new Error();
    return true;
  };

  const getValues = (node) => {
    return node ? (isArray(node) ? (isFinite(node[0]) ? node[1] : node) : [node]) : [];
  };

  const getSums = (node) => {
    if (!isValidNode(node)) throw new Error();
    let sums = Number.isFinite(node[0]) ? node[2] : null;
    return sums || (buildStats ? buildStats(getValues(node)) : null);
  };

  const setValues = (node, values) => {
    if (values.length > NODE_SIZE) throw new Error();

    return isFinite(node[0]) || buildStats ? treeFromValues(values) : freeze(values);
  };

  function* traverse(tree) {
    let states = emptyStack.push({ node: tree, i: 0 });

    assertValidNode(tree);

    stack: while (states.size) {
      const s = states.value;
      const { node } = s;

      const values = getValues(node);

      for (let { i } = s; s.i < values.length; ) {
        const value = values[i];
        if (isArray(value)) {
          let node = value;
          assertValidNode(node);
          states = states.push({ node, i: 0 });
          i = ++s.i;
          continue stack;
        } else {
          yield value;
          i = ++s.i;
        }
      }

      states = states.pop();
    }
  }

  const getSize = (tree) => {
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

  const findPath = (idx, tree, depth = Infinity) => {
    if (idx == null) throw new Error();

    let path = emptyStack;

    let treeSum = getSize(tree);
    let currentIdx = idx < 0 ? treeSum - 1 : 0;
    let direction = idx < 0 ? -1 : 1;
    let targetIdx = idx < 0 ? treeSum + idx : idx;

    let node = tree;
    stack: while (node) {
      assertValidNode(node);

      const values = getValues(node);
      let candidateNode;

      let backwards = idx < 0;
      const increment = backwards ? -1 : 1;
      for (
        let i = backwards ? values.length - 1 : 0;
        backwards ? i >= 0 : i < values.length;
        i += increment
      ) {
        let value = values[i];
        if (isArray(value) && path.size < depth - 1) {
          candidateNode = value;

          const sum = getSize(candidateNode);

          const nextCount = currentIdx + sum * direction;
          if (
            (backwards ? nextCount <= targetIdx : nextCount > targetIdx) ||
            (backwards ? nextCount < 0 : nextCount >= treeSum)
          ) {
            path = path.push({ index: i, node });
            node = candidateNode;
            continue stack;
          } else {
            currentIdx += sum * direction;
          }
        } else {
          const sum = getSize(value);
          const nextCount = currentIdx + sum * direction;
          if (!isFinite(targetIdx)) {
            return path.push({ index: targetIdx, node });
          } else if (currentIdx === targetIdx) {
            return path.push({ index: i, node });
          } else if (
            backwards
              ? nextCount < targetIdx || nextCount < 0
              : nextCount > targetIdx || nextCount >= treeSum
          ) {
            break;
          } else {
            currentIdx += direction;
          }
        }
      }
      return path.push({ index: backwards ? -Infinity : Infinity, node });
    }

    return null;
  };

  const getAt = (idx, tree) => {
    const v = findPath(idx, tree)?.value;
    return v && getValues(v.node)[v.index];
  };

  const replaceAt = (idx, tree, value) => {
    let path = findPath(idx, tree);

    if (getSize(tree) < idx) {
      throw new Error('Cannot add past the end of a list');
    } else if (getSize(tree) === idx) {
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

  return {
    buildModule,
    btreeFrom: treeFrom,
    from: treeFrom,
    btreeFromValues: treeFromValues,
    fromValues: treeFromValues,
    findBalancePoint,
    splitValues,
    collapses,
    nodeCollapses,
    nodeCanDonate,
    pop,
    removeAt,
    push,
    addAt,
    concat,
    isValidNode,
    assertValidNode,
    getValues,
    getSums,
    setValues,
    traverse,
    getSize,
    findPath,
    getAt,
    replaceAt,
  };
};
