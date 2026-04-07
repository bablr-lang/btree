import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';
import { has, compareNames } from './set.js';

let { freeze } = Object;

export { defaultNodeSize, compareNames };

// A KeyedList is like a Map but does not prevent same-key duplicates

export const entry = (key, value) => freeze([key, value]);

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
      let entry = value;
      if (entry[0] === key) {
        path.push(i);
        return path;
      }
    }
  }

  return null;
};

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

const module_ = buildModule(defaultNodeSize, sumValues, Symbol.for('KeyedList'));

const {
  from,
  fromValues,
  create,
  unshift,
  push,
  pop,
  removeAt,
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

  if (!has(key, node)) {
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
        if (has(key, value)) {
          node = value;
          continue outer;
        }
      }
    }

    return null;
  }

  return null;
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
