import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';
import { freezeRecord } from '@bablr/record';

let { reduce } = Array.prototype;

export { defaultNodeSize };

let __has = (name, keys, startIdx = 0, endIdx = keys.length - 1) => {
  if (!keys.length || endIdx < startIdx) return null;

  let idx = startIdx + Math.floor((endIdx - startIdx) / 2 + 0.1);
  let key = keys[idx];

  let direction = compareNames(name, key);

  if (direction === 0) {
    return true;
  } else {
    if (startIdx === endIdx) return false;

    if (direction > 0) {
      return __has(name, keys, idx + 1, endIdx);
    } else {
      return __has(name, keys, startIdx, idx - 1);
    }
  }
};

export const findKeyPath = (key, node) => {
  let values = getValues(node);
  let depth = getDepth(node);
  let path = [];

  if (!depth) return null;

  for (let i = 0; i < values.length; i++) {
    let value = values[i];

    if (depth > 1) {
      let node = value;
      if (has(key, node)) {
        path.push(i);
        values = getValues(node);
        depth = getDepth(node);
      }
    } else {
      if (value === key) {
        path.push(i);
        return path;
      }
    }
  }

  return null;
};

export const compareNames = (a, b) => (a > b ? 1 : b > a ? -1 : 0);

export const sumValues = (values, depth) => {
  let keys = reduce.call(
    values,
    (keys, val) => {
      if (isNode(val) && depth > 1) {
        let sums = getSums(val);
        for (let i = 0; i < sums.length; i++) {
          let key = sums[i];
          if (keys.includes(key)) throw new Error();

          keys.push(key);
        }
      } else if (val) {
        if (keys.includes(val)) throw new Error();

        keys.push(val);
      }
      return keys;
    },
    [],
  );

  return freezeRecord(keys.sort((a, b) => compareNames(a, b)));
};

const module_ = buildModule(defaultNodeSize, sumValues, Symbol.for('Set'));

const {
  from,
  fromValues,
  create,
  unshift,
  pop,
  removeAt,
  addAt,
  shift,
  concat,
  replaceAt,
  isValidNode,
  isNode,
  getValues,
  getSums,
  getSize,
  getType,
  getDepth,
  traverse,
  findPath,
  getAt,
  empty,
} = module_;

const has = (key, node) => {
  return node && __has(key, getSums(node));
};

const add = (key, node) => {
  if (!has(key, node)) {
    return push(key, node);
  } else {
    return node;
  }
};

const push = (key, node) => {
  if (has(key, node)) {
    let keyPath = findKeyPath(key, node);
    return module_.push(key, removeAt(keyPath, node));
  } else {
    return module_.push(key, node);
  }
};

export {
  from,
  fromValues,
  create,
  unshift,
  pop,
  removeAt,
  push,
  addAt,
  shift,
  concat,
  replaceAt,
  empty,
  has,
  add,
  isNode,
  isValidNode,
  getValues,
  getSums,
  getSize,
  getType,
  getDepth,
  traverse,
  findPath,
  getAt,
};
