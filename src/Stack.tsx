import {
  moveIn,
  insertAfter,
  removeAt,
  updateAt,
  replaceAt,
} from './ArrayUtils';

export type Item = { text: string };

export type ItemPosition = { layerIndex: number; itemIndex: number };

export type DragItem = {
  type: string;
  id: string;
  position: ItemPosition;
};

export type DragLayer = {
  type: string;
  id: string;
  index: number;
};

export enum ItemTypes {
  CARD = 'CARD',
  LAYER = 'LAYER',
}

export const EMPTY_STACK: Item[][] = [[]];

export function stringifyStack(stack: Item[][]): string {
  return stack
    .map((layer) => {
      return layer
        .map((item) => {
          return `- ${item.text}`;
        })
        .join('\n');
    })
    .join('\n\n---\n\n')
    .trim();
}

export function parseStack(input: string): Item[][] {
  const result: Item[][] = input
    .trim()
    .replace(/\r?\n/g, '\n')
    .split(/---\n/)
    .map((s) => s.trim())
    .filter((s) => s)
    .map((layerString) => {
      return layerString
        .split(/\r?\n/)
        .map((s) => s.trim())
        .map((s) => /^-\s+(.*)/.exec(s)?.[1] ?? '')
        .filter((s) => s)
        .map((text) => ({ text }));
    });
  return result;
}

export function moveItem(
  stack: Item[][],
  src: ItemPosition,
  dest: ItemPosition
): Item[][] {
  if (src.layerIndex === dest.layerIndex) {
    const layer = stack[src.layerIndex];
    const newLayer = moveIn(layer, src.itemIndex, dest.itemIndex);
    return replaceAt(stack, src.layerIndex, newLayer);
  } else {
    const srcLayer = stack[src.layerIndex];
    const destLayer = stack[dest.layerIndex];
    const srcItem = srcLayer[src.itemIndex];
    const newSrcLayer = removeAt(srcLayer, src.itemIndex);
    const newDestLayer = insertAfter(destLayer, dest.itemIndex, srcItem);
    return replaceAt(
      replaceAt(stack, src.layerIndex, newSrcLayer),
      dest.layerIndex,
      newDestLayer
    );
  }
}
