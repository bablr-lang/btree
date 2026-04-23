import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';
import { freezeRecord } from '@bablr/record';
import { has, compareNames } from './set.js';

let { freeze } = Object;
let { reduce } = Array.prototype;

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
  let keys = reduce.call(
    values,
    (keys, val) => {
      if (isNode(val)) {
        let sums = getSums(val);
        for (let i = 0; i < sums.length; i++) {
          let key = sums[i];
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
    },
    [],
  );

  return freezeRecord(keys.sort((a, b) => compareNames(a, b)));
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

    let values = getValues(node);
    for (let i = 0; i < values.length; i++) {
      let value = values[i];
      if (!isNode(value)) {
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
