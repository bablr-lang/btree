import { buildModule, defaultNodeSize } from '@bablr/btree/enhanceable';
import { get, has, compareNames, entry } from './keyed-list.js';

let { freeze } = Object;

export { defaultNodeSize, compareNames, entry };

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
        if (keys.includes(key)) throw new Error();

        keys.push(key);
      }
    } else if (val) {
      let { 0: key } = val;

      if (keys.includes(key)) throw new Error();

      keys.push(key);
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

const set = (key, value, node) => {
  if (!has(key, node)) {
    return push(entry(key, value), node);
  } else {
    return node;
  }
};

const push = (entry, node) => {
  let { 0: key } = entry;
  if (has(key, node)) {
    let keyPath = findKeyPath(key, node);
    return module_.push(entry, removeAt(keyPath, node));
  } else {
    return module_.push(entry, node);
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
  get,
  set,
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
