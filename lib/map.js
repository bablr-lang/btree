import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';
import { findKey } from './set.js';

const { freeze } = Object;

export { defaultNodeSize };
export { findKey };

export const entry = (key, value) => [key, value];

export const compareNames = (a, b) => (a > b ? 1 : b > a ? -1 : 0);

export const sumValues = (values) => {
  let keys = values.reduce((keys, val) => {
    if (isNode(val)) {
      for (const key of getSums(val)) {
        if (!keys.includes(key)) {
          keys.push(key);
        }
      }
    } else if (val) {
      let { 0: key } = val;

      if (!keys.includes(key)) {
        keys.push(key);
      }
    }
    return keys;
  }, []);

  return freeze(keys.sort((a, b) => compareNames(a, b)));
};

const module_ = buildModule(defaultNodeSize, sumValues, Symbol.for('Map'));

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

const get = (key, map) => {
  let node = map;

  if (!findKey(key, getSums(node))) {
    return null;
  }

  outer: while (node) {
    let keys = getSums(node);

    if (!keys) throw new Error();

    for (const value of getValues(node)) {
      if (isLeaf(value)) {
        let entry = value;
        if (entry[0] === key) {
          return entry[1];
        }
      } else {
        let valueSums = getSums(value);
        if (findKey(key, valueSums)) {
          node = value;
          continue outer;
        }
      }
    }

    return null;
  }

  return null;
};

const set = (key, value, node) => {
  if (!has(key, node)) {
    return push(entry(key, value), node);
  } else {
    return node;
  }
};

const has = (key, node) => {
  return node && !!findKey(key, getSums(node));
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
  get,
  set,
  has,
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
