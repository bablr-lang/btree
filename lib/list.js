import { defaultNodeSize, buildModule } from './enhanceable.js';

export { defaultNodeSize };

export const {
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
} = buildModule();
