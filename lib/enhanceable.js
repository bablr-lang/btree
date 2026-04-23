import { arrayValues, freezeRecord, isRecord } from '@bablr/record';

let { isArray } = Array;
let { isFinite } = Number;
let { slice, reduce } = Array.prototype;

export const defaultNodeSize = 8;

export const buildModule = (NODE_SIZE = defaultNodeSize, buildStats, type = Symbol.for('List')) => {
  if (typeof type !== 'symbol') throw new Error();

  const countValues = (nodes) => {
    if (Object.getPrototypeOf(nodes)) throw new Error();
    return Array.prototype.map.call(nodes, getValueSize).reduce((a, b) => a + b, 0);
  };

  const getType = (value) => {
    return isNode(value) ? value[3] : 0;
  };

  const getDepth = (value) => {
    return isNode(value) ? value[4] : 0;
  };

  const treeFrom = (...values) => {
    return treeFromValues(values);
  };

  const create = () => {
    return treeFromValues([]);
  };

  const treeFromValues = (values, depth) => {
    let depth_ = depth ?? Infinity;
    if (isArray(values)) {
      freezeRecord(values);

      if (isFinite(values[0])) throw new Error();

      let firstValue = values[0];
      let firstDepth = getDepth(firstValue);

      if (depth_ === Infinity) {
        depth_ = firstDepth + 1;
      }

      if (depth_ > 1) {
        if (depth_ !== firstDepth + 1) throw new Error();

        for (let i = 0; i < values.length; i++) {
          let value = values[i];
          if (nodeCollapses(value)) {
            throw new Error('invalid btree: uncollapsed node');
          } else if (getDepth(value) !== firstDepth) {
            throw new Error('tree of mixed depths');
          } else if (getType(value) !== type) {
            throw new Error('tree of mixed types');
          }
        }
      }
    }

    let tree;
    if (isArray(values) && values.length <= NODE_SIZE) {
      let stats = buildStats ? buildStats(values) : null;

      tree = freezeRecord([countValues(values), freezeRecord(values), stats, type, depth_]);
      if (!isRecord(tree)) throw new Error();
    } else {
      tree = treeFromValues([]);
      let temp = [];
      for (let value of isArray(values) ? arrayValues(values) : values) {
        temp.push(value);
        if (temp.length >= NODE_SIZE) {
          tree = concat(tree, treeFromValues(temp));
          temp = [];
        }
      }
      if (temp.length) {
        tree = concat(tree, treeFromValues(temp));
      }
    }

    return tree;
  };

  const findBalancePoint = (values) => {
    let leftSum = 0;
    let rightSum = reduce.call(values, (sum, v) => sum + getSize(v), 0);
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

    let leftValues = slice.call(values, 0, midIndex);
    let rightValues = slice.call(values, midIndex);

    return { leftValues, rightValues };
  };

  const setValuesAt = (idx, node, value) => {
    const values = getValues(node);

    if (!Number.isFinite(idx)) throw new Error();

    if (!value == null) {
      throw new Error();
    }

    const newValues = [...arrayValues(values)];
    newValues[idx] = value;
    return treeFromValues(newValues);
  };

  const concat = (first, second) => {
    if (!isNode(first) || !isNode(second)) throw new Error();

    let firstHeight = getDepth(first);
    let secondHeight = getDepth(second);
    let firstValues = getValues(first);
    let secondValues = getValues(second);

    if (!secondValues.length) return first;
    if (!firstValues.length) return second;

    if (firstHeight === secondHeight) {
      if (firstValues.length + secondValues.length <= NODE_SIZE) {
        return treeFromValues([...arrayValues(firstValues), ...arrayValues(secondValues)]);
      } else {
        let { leftValues, rightValues } = splitValues([
          ...arrayValues(firstValues),
          ...arrayValues(secondValues),
        ]);
        return treeFromValues([treeFromValues(leftValues), treeFromValues(rightValues)]);
      }
    } else {
      let tree = firstHeight <= secondHeight ? second : first;
      let pushout = firstHeight > secondHeight ? second : first;

      if (!nodeCollapses(pushout)) {
        let targetIndex = firstHeight > secondHeight ? getSize(tree) : 0;
        return addAt(targetIndex, pushout, tree);
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
          return replaceAt(targetIndex, treeFromValues(combinedValues), tree);
        } else {
          let { leftValues, rightValues } = splitValues(combinedValues);

          if (firstHeight > secondHeight) {
            return replaceAt(targetIndex, leftValues, addAt(targetIndex + 1, tree, rightValues));
            // return addAt(targetIndex + 1, replaceAt(targetIndex, leftValues, tree), rightValues);
          } else {
            // TODO change order of operations like above?
            return addAt(targetIndex, replaceAt(targetIndex, rightValues, tree), leftValues);
          }
        }
      }
    }
  };

  const addAt = (idx, value, tree) => {
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
        values = [...arrayValues(values)];

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

  const push = (value, tree) => {
    let size = getSize(tree);
    return size ? addAt(size, value, tree) : treeFromValues([value]);
  };

  const unshift = (value, tree) => {
    return addAt(0, value, tree);
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

    const initialValues = [...arrayValues(getValues(node))];

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
          let targetValues = slice.call(getValues(targetSibling));

          const donationIdx = targetSibling === prevSibling ? targetValues.length - 1 : 0;
          const donated = targetValues[donationIdx];
          targetValues.splice(donationIdx, 1);

          adjustSibling = {
            node: treeFromValues(targetValues),
            index: targetSiblingIndex,
          };

          values = slice.call(values);

          values.splice(targetSibling === prevSibling ? values.length : 0, 0, donated);

          returnValue = treeFromValues(values);
        } else if (prevSibling && getValues(prevSibling).length + values.length <= NODE_SIZE) {
          adjustSibling = {
            node: null,
            index: parentIndex - 1,
          };

          returnValue = treeFromValues([
            ...arrayValues(getValues(prevSibling)),
            ...arrayValues(values),
          ]);
        } else if (nextSibling && values.length + getValues(nextSibling).length <= NODE_SIZE) {
          adjustSibling = {
            node: null,
            index: parentIndex + 1,
          };

          returnValue = treeFromValues([
            ...arrayValues(values),
            ...arrayValues(getValues(nextSibling)),
          ]);
        }
      }

      if (pathIdx === 0) {
        return returnValue;
      }

      pathIdx--;
      ({ node, index } = path[pathIdx]);

      values = slice.call(getValues(node));

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
    if (!isRecord(node) || !isRecord(values)) return false;

    return !node[0] || isFinite(node[0]) || ['object', 'string'].includes(typeof node[0]);
  };

  const assertValidNode = (node) => {
    if (!isArray(node)) throw new Error();
    const values = node[1];
    if (!isArray(values) || values.length > NODE_SIZE) throw new Error();
    if (!isRecord(node) || !isRecord(values)) throw new Error();

    if (node[0] && !isFinite(node[0]) && !['object', 'string'].includes(typeof node[0]))
      throw new Error();
  };

  const isNode = (value) => {
    let isArr = isArray(value);
    return isArr && typeof value[0] === 'number';
  };

  const getValues = (node) => {
    return node ? (isNode(node) ? node[1] : freezeRecord([node])) : freezeRecord([]);
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
      let s = states[states.length - 1];
      let { node } = s;

      let values = getValues(node);
      let depth = getDepth(node);

      for (let { i } = s; s.i < values.length; ) {
        let value = values[i];
        if (isNode(value) && depth >= 1) {
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

  const map = (fn, tree) => {
    let s = { node: tree, i: 0, returnValue: undefined };
    let states = [s];
    let lastState = s;

    assertValidNode(tree);

    stack: while (states.length) {
      let { node } = s;

      let values = getValues(node);
      let depth = getDepth(node);

      if (depth > 1) {
        s.returnValue ||= [];

        if (s.i < values.length) {
          let node = values[s.i++];
          assertValidNode(node);
          lastState = s;
          s = { node, i: 0 };
          states.push(s);

          continue stack;
        }
      } else {
        s.returnValue = Array.prototype.map.call(values, fn);
      }

      lastState = s;
      states.pop();
      s = states[states.length - 1];
      if (s) {
        s.returnValue.push(treeFromValues(lastState.returnValue));
      }
    }
    return treeFromValues(lastState.returnValue);
  };

  const getValueSize = (value) => {
    if (!isNode(value)) {
      return 1;
    } else {
      return value[0];
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
      if (idx.length > getDepth(tree)) return null;
      for (let seg of arrayValues(idx)) {
        let index = typeof seg !== 'object' ? seg : seg.index;
        if (typeof index === 'string') throw new Error();
        if (!isNode(node)) return null;
        let index_ = index < 0 ? getSize(node) + index : index;
        path.push({ index: index_, node });
        node = getValues(node)[index_];
        if (node && !isNode(node)) {
          return path;
        }
        if (!node) return null;
      }

      return path;
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

            return path;
          } else if (backwards ? nextIndex < targetIdx : nextIndex > targetIdx) {
            path.push({ index: i, node });

            return path;
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

      return path;
    }

    return null;
  };

  const getAt = (idx, tree) => {
    const path = findPath(idx, tree);
    let seg = path && path[path.length - 1];
    return seg && getValues(seg.node)[seg.index];
  };

  const replaceAt = (idx, value, tree) => {
    let path = findPath(idx, tree, getDepth(tree) - getDepth(value) - 1);

    if (getSize(tree) < idx) {
      throw new Error('Cannot add past the end of a list');
    } else if (getSize(tree) === idx) {
      return addAt(idx, value, tree);
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
    assertValidNode,
    getValues,
    getSums,
    getSize,
    getType,
    getDepth,
    traverse,
    map,
    findPath,
    getAt,
    replaceAt,
  };
};
