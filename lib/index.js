import { defaultNodeSize, deepFreeze, buildModule } from './enhanceable.js';

export { defaultNodeSize, deepFreeze };

export const {
  btreeFrom,
  from,
  btreeFromValues,
  fromValues,
  findBalancePoint,
  splitValues,
  collapses,
  nodeCollapses,
  nodeCanDonate,
  pop,
  push,
  concat,
  addAt,
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
} = buildModule();
