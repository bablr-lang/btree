import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';

const { freeze } = Object;

export { defaultNodeSize };

const __findKey = (name, keys, startIdx, endIdx) => {
  if (!keys.length || endIdx < startIdx) return null;

  let idx = startIdx + Math.floor((endIdx - startIdx) / 2 + 0.1);
  let key = keys[idx];

  let direction = compareNames(name, key);

  if (direction === 0) {
    return name;
  } else {
    if (startIdx === endIdx) return null;

    if (direction > 0) {
      return __findKey(name, keys, idx + 1, endIdx);
    } else {
      return __findKey(name, keys, startIdx, idx - 1);
    }
  }
};

export const findKey = (name, keys, startIdx = 0, endIdx = keys.length - 1) => {
  return __findKey(name, keys, startIdx, endIdx);
};

export const compareNames = (a, b) => (a > b ? 1 : b > a ? -1 : 0);

export const sumValues = (values) => {
  let keys = values.reduce((keys, val) => {
    if (isNode(val)) {
      for (const key of getSums(val)) {
        if (keys.includes(key)) throw new Error();

        keys.push(key);
      }
    } else if (val) {
      if (keys.includes(val)) throw new Error();

      keys.push(val);
    }
    return keys;
  }, []);

  return freeze(keys.sort((a, b) => compareNames(a, b)));
};

const module_ = buildModule(defaultNodeSize, sumValues, Symbol.for('Set'));

const {
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
  isValidNode,
  isNode,
  isLeaf,
  getValues,
  getSums,
  getSize,
  getType,
  getDepth,
  traverse,
  findPath,
  getAt,
} = module_;

const has = (key, node) => {
  return node && !!findKey(key, getSums(node));
};

const add = (key, node) => {
  if (!has(key, node)) {
    return push(node, key);
  } else {
    return node;
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
  has,
  add,
  isNode,
  isLeaf,
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
