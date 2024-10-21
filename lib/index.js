import { buildModule } from './enhanceable.js';

export const {
  from,
  fromValues,

  findBalancePoint,
  split,
  collapses,
  nodeCollapses,
  nodeCanDonate,
  pop,
  push,
  addAt,
  isValidNode,
  assertValidNode,
  getValues,
  setValues,
  isLeafNode,
  traverse,
  getSum,
  findPath,
  getAt,
  replaceAt,
  freeze,
} = buildModule();
