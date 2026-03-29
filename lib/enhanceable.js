const { isArray } = Array;
const { freeze, isFrozen } = Object;
const { isFinite } = Number;

export const defaultNodeSize = 8;

export const buildModule = (NODE_SIZE = defaultNodeSize, buildStats, type = Symbol.for('List')) => {
  if (typeof type !== 'symbol') throw new Error();

  let validNodes = new WeakSet();

  const countValues = (nodes) => {
    return nodes.map(getValueSize).reduce((a, b) => a + b, 0);
  };

  const getType = (value) => {
    return isNode(value) ? value[3] : 0;
  };

  const getDepth = (value) => {
    return isNode(value) ? value[4] : 0;
  };

  const treeFrom = (...values) => {
    if (!buildStats && values.length <= NODE_SIZE) {
      return treeFromValues(values);
    } else {
      let tree = treeFromValues([]);
      for (const value of values) {
        tree = push(tree, value);
      }
      return tree;
    }
  };

  const create = () => {
    return treeFromValues([]);
  };

  const treeFromValues = (values, depth) => {
    if (isFinite(values[0])) throw new Error();

    let firstValue = values[0];
    let firstDepth = getDepth(firstValue);

    if (depth === undefined) {
      depth = firstDepth + 1;
    }

    if (depth > 1) {
      if (depth !== firstDepth + 1) throw new Error();

      for (let value of values) {
        if (nodeCollapses(value)) {
          throw new Error('invalid btree: uncollapsed node');
        } else if (value == null) {
          throw new Error('invalid btree: nil sibling');
        } else if (getDepth(value) !== firstDepth) {
          throw new Error('tree of mixed depths');
        } else if (getType(value) !== type) {
          throw new Error('tree of mixed types');
        }
      }
    }

    let tree;
    if (values.length <= NODE_SIZE) {
      let stats = buildStats ? buildStats(values) : null;
      let depth = isNode(firstValue) ? getDepth(firstValue) + 1 : 1;

      tree = freeze([countValues(values), freeze(values), stats, type, depth]);
    } else {
      tree = treeFrom(...values);
    }
    validNodes.add(tree);
    return tree;
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
    let midIndex;

    // if (isLeaf(values)) {
    midIndex = Math.floor(values.length / 2 + 0.01);
    // } else {
    //   midIndex = findBalancePoint(values);
    // }

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
    if (isLeaf(first) || isLeaf(second)) throw new Error();

    let firstHeight = getDepth(first);
    let secondHeight = getDepth(second);
    let firstValues = getValues(first);
    let secondValues = getValues(second);

    if (!secondValues.length) return first;
    if (!firstValues.length) return second;

    if (firstHeight === secondHeight) {
      if (firstValues.length + secondValues.length <= NODE_SIZE) {
        return treeFromValues([...firstValues, ...secondValues]);
      } else {
        let { leftValues, rightValues } = splitValues([...firstValues, ...secondValues]);
        return treeFromValues([treeFromValues(leftValues), treeFromValues(rightValues)]);
      }
    } else {
      let tree = firstHeight <= secondHeight ? second : first;
      let pushout = firstHeight > secondHeight ? second : first;

      if (!nodeCollapses(pushout)) {
        let targetIndex = firstHeight > secondHeight ? getSize(tree) : 0;
        return addAt(targetIndex, tree, pushout);
      } else {
        let depth = Math.abs(firstHeight - secondHeight) - 1;
        let targetIndex = firstHeight > secondHeight ? getSize(tree) - 1 : 0;
        let targetPath = findPath(targetIndex, tree, depth);
        let lastIndex = targetPath.length - 1;
        let targetNode = getValues(targetPath[lastIndex].node)[targetPath[lastIndex].index];
        let combinedValues =
          firstHeight > secondHeight
            ? [...getValues(targetNode), ...getValues(pushout)]
            : [...getValues(pushout), ...getValues(targetNode)];
        if (getValues(pushout).length + getValues(targetNode).length <= NODE_SIZE) {
          return replaceAt(targetIndex, tree, treeFromValues(combinedValues));
        } else {
          let { leftValues, rightValues } = splitValues(combinedValues);

          if (firstHeight > secondHeight) {
            return replaceAt(targetIndex, addAt(targetIndex + 1, tree, rightValues), leftValues);
            // return addAt(targetIndex + 1, replaceAt(targetIndex, tree, leftValues), rightValues);
          } else {
            // TODO change order of operations like above?
            return addAt(targetIndex, replaceAt(targetIndex, tree, rightValues), leftValues);
          }
        }
      }
    }
  };

  const addAt = (idx, tree, value) => {
    if (idx < 0 || !Number.isFinite(idx)) throw new Error('invalid argument');
    if (!isArray(tree)) throw new Error();
    if (!value) throw new Error();

    let path = findPath(idx, tree, getDepth(tree) - getDepth(value) - 1);

    let pathIdx = path.length - 1;
    let { node, index } = path[pathIdx];

    let pushout = value;

    let values = getValues(node);

    for (;;) {
      if (pushout) {
        values = values.slice();

        let finiteIndex = index === Infinity ? values.length : index;

        if (!isFinite(finiteIndex)) throw new Error();
        if (values.length + (pushout ? 1 : 0) > NODE_SIZE) {
          values.splice(finiteIndex, 0, pushout);
          const { leftValues, rightValues } = splitValues(values);

          pushout = treeFromValues(leftValues);
          node = treeFromValues(rightValues);
        } else {
          values.splice(finiteIndex, 0, pushout);
          node = treeFromValues(values);
          pushout = null;
        }
      }

      if (pathIdx === 0) {
        if (pushout) {
          return treeFromValues([pushout, node]);
        } else {
          return node;
        }
      }

      const poppedNode = node;
      pathIdx--;
      ({ node, index } = path[pathIdx]);

      node = setValuesAt(index, node, poppedNode);
      values = getValues(node);
    }
  };

  const push = (tree, value) => {
    let size = getSize(tree);
    return size ? addAt(size, tree, value) : treeFromValues([value]);
  };

  const unshift = (value, tree) => {
    return addAt(0, tree, value);
  };

  const collapses = (size) => {
    return size < NODE_SIZE / 2 - 0.01;
  };

  const nodeCollapses = (node) => {
    return collapses(getValues(node).length);
  };

  const nodeCanDonate = (node) => {
    return !collapses(getValues(node).length - 1);
  };

  const removeAt = (idx, tree) => {
    if (idx > getSize(tree)) throw new Error('Index exceeds tree bounds');

    let path = findPath(idx, tree);

    let pathIdx = path.length - 1;
    let { node, index } = path[pathIdx];

    const initialValues = [...getValues(node)];

    initialValues.splice(index, 1);

    let returnValue = !isFinite(node[0]) ? initialValues : treeFromValues(initialValues);

    for (;;) {
      let values = getValues(returnValue);
      let adjustSibling = null;

      if (pathIdx >= 1 && nodeCollapses(returnValue)) {
        let { node: parentNode, index: parentIndex } = path[pathIdx - 1];
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
            node: treeFromValues(targetValues),
            index: targetSiblingIndex,
          };

          values = values.slice();

          values.splice(targetSibling === prevSibling ? values.length : 0, 0, donated);

          returnValue = treeFromValues(values);
        } else if (prevSibling && getValues(prevSibling).length + values.length <= NODE_SIZE) {
          adjustSibling = {
            node: null,
            index: parentIndex - 1,
          };

          returnValue = treeFromValues([...getValues(prevSibling), ...values]);
        } else if (nextSibling && values.length + getValues(nextSibling).length <= NODE_SIZE) {
          adjustSibling = {
            node: null,
            index: parentIndex + 1,
          };

          returnValue = treeFromValues([...values, ...getValues(nextSibling)]);
        }
      }

      if (pathIdx === 0) {
        return returnValue;
      }

      pathIdx--;
      ({ node, index } = path[pathIdx]);

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

      if (values.length === 1) {
        values = getValues(values[0]);
      }

      returnValue = node = treeFromValues(values);
    }
  };

  const pop = (tree) => {
    return removeAt(-1, tree);
  };

  const shift = (tree) => {
    return removeAt(0, tree);
  };

  const isValidNode = (node) => {
    if (!isArray(node)) return false;
    const values = getValues(node);
    if (!isArray(values) || values.length > NODE_SIZE) return false;
    if (!isFrozen(node) || !isFrozen(values)) return false;

    return !node[0] || isFinite(node[0]) || ['object', 'string'].includes(typeof node[0]);
  };

  const isLeaf = (value) => {
    let isArr = isArray(value);
    return !isArr || typeof value[0] !== 'number';
  };

  const isNode = (value) => {
    let isArr = isArray(value);
    return isArr && typeof value[0] === 'number';
  };

  const assertValidNode = (node) => {
    if (!isValidNode(node)) throw new Error();
    return true;
  };

  const getValues = (node) => {
    return node ? (isNode(node) ? node[1] : [node]) : [];
  };

  const getSums = (node) => {
    assertValidNode(node);

    let sums = Number.isFinite(node[0]) ? node[2] : null;
    return sums || (buildStats ? buildStats(getValues(node)) : null);
  };

  function* traverse(tree) {
    let states = [{ node: tree, i: 0 }];

    assertValidNode(tree);

    stack: while (states.length) {
      const s = states[states.length - 1];
      const { node } = s;

      const values = getValues(node);

      for (let { i } = s; s.i < values.length; ) {
        const value = values[i];
        if (isNode(value)) {
          let node = value;
          assertValidNode(node);
          states.push({ node, i: 0 });
          i = ++s.i;
          continue stack;
        } else {
          yield value;
          i = ++s.i;
        }
      }

      states.pop();
    }
  }

  const getValueSize = (value) => {
    if (!isNode(value)) {
      return 1;
    } else if (isFinite(value[0])) {
      return value[0];
    } else {
      return value.length;
    }
  };

  const getSize = (tree) => {
    if (tree == null) {
      return 0;
    } else {
      return getValueSize(tree);
    }
  };

  const findPath = (idx, tree, depth = Infinity) => {
    if (idx == null) throw new Error();
    if (tree && !isArray(tree)) throw new Error();

    let path = [];
    let node = tree;

    if (isArray(idx)) {
      for (let seg of idx) {
        let index = typeof seg !== 'object' ? seg : seg.index;
        if (typeof index === 'string') throw new Error();
        if (isLeaf(node)) return null;
        let index_ = index < 0 ? getSize(node) + index : index;
        path.push({ index: index_, node });
        node = getValues(node)[index_];
        if (node && isLeaf(node)) {
          return freeze(path);
        }
        if (!node) return null;
      }

      return freeze(path);
    }

    let treeSum = getSize(tree);
    let currentIdx = idx < 0 ? treeSum - 1 : 0;
    let direction = idx < 0 ? -1 : 1;
    let targetIdx = idx < 0 ? treeSum + idx : idx;

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
        if (isNode(value) && path.length < depth) {
          candidateNode = value;

          const sum = getSize(candidateNode);
          const nextIndex = currentIdx + sum * direction;
          if (
            (backwards ? nextIndex < targetIdx : nextIndex > targetIdx) ||
            (backwards ? nextIndex < 0 : nextIndex >= treeSum)
          ) {
            path.push({ index: i, node });
            node = candidateNode;
            continue stack;
          } else {
            currentIdx += sum * direction;
          }
        } else {
          const sum = getSize(value);
          const nextIndex = currentIdx + sum * direction;
          if (!isFinite(targetIdx)) {
            path.push({ index: targetIdx, node });

            return freeze(path);
          } else if (backwards ? nextIndex < targetIdx : nextIndex > targetIdx) {
            path.push({ index: i, node });

            return freeze(path);
          } else if (
            backwards
              ? nextIndex < targetIdx || nextIndex < 0
              : nextIndex > targetIdx || nextIndex >= treeSum
          ) {
            break;
          } else {
            currentIdx += direction * sum;
          }
        }
      }

      path.push({ index: backwards ? -Infinity : Infinity, node });

      return freeze(path);
    }

    return null;
  };

  const getAt = (idx, tree) => {
    const path = findPath(idx, tree);
    let seg = path && path[path.length - 1];
    return seg && getValues(seg.node)[seg.index];
  };

  const replaceAt = (idx, tree, value) => {
    let path = findPath(idx, tree, getDepth(tree) - getDepth(value) - 1);

    if (getSize(tree) < idx) {
      throw new Error('Cannot add past the end of a list');
    } else if (getSize(tree) === idx) {
      return addAt(idx, tree, value);
    }

    let pathIndex = path.length - 1;
    let { node, index } = path[pathIndex];

    let returnValue = setValuesAt(index, node, value);

    for (;;) {
      ({ node, index } = path[pathIndex]);

      if (pathIndex > 0) {
        pathIndex--;
        ({ node, index } = path[pathIndex]);

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
    create,
    btreeFromValues: treeFromValues,
    fromValues: treeFromValues,
    findBalancePoint,
    splitValues,
    collapses,
    nodeCollapses,
    nodeCanDonate,
    unshift,
    pop,
    removeAt,
    push,
    addAt,
    shift,
    unshift,
    concat,
    isValidNode,
    isNode,
    isLeaf,
    assertValidNode,
    getValues,
    getSums,
    getSize,
    getType,
    getDepth,
    traverse,
    findPath,
    getAt,
    replaceAt,
  };
};
