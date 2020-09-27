import { Item, ItemPosition } from './Stack';

export function generateLookup(stack: Item[][]): Array<[string, string]> {
  const lookup: Lookup = {};

  stack.forEach((items, layerIndex) => {
    items.forEach((item, itemIndex) => {
      const position: ItemPosition = { layerIndex, itemIndex };
      const lookupItem: LookupItem = { item, position };
      getTags(item).forEach((tag) => {
        addToLookup(lookup, tag, layerIndex, lookupItem);
      });
    });
  });

  return Object.values(lookup)
    .flatMap(combineNest)
    .map(([a, b]) => [getLookupKey(a.position), getLookupKey(b.position)]);
}

type LookupItem = {
  item: Item;
  position: ItemPosition;
};

type Lookup = Record<string, LookupItem[][]>;

export function getLookupKey(position: ItemPosition): string {
  return `item-${position.layerIndex}-${position.itemIndex}`;
}

function combine<T>(xs: T[], ys: T[]): Array<[T, T]> {
  const result: Array<[T, T]> = [];
  xs.forEach((x) => {
    ys.forEach((y) => {
      result.push([x, y]);
    });
  });
  return result;
}
function flatten<T>(itemGroups: T[][]): T[] {
  const result: T[] = [];
  itemGroups.forEach((itemGroup) => {
    itemGroup.forEach((item) => {
      result.push(item);
    });
  });
  return result;
}
function combineNest<T>(itemGroups: T[][]): Array<[T, T]> {
  const nested: Array<[T, T]>[] = [];
  for (let i = 0; i < itemGroups.length - 1; i += 1) {
    const g1 = itemGroups[i];
    const g2 = itemGroups[i + 1];
    nested.push(combine(g1, g2));
  }
  return flatten(nested);
}
function allocate<T>(items: T[][], newLength: number): void {
  const length = items.length;
  if (newLength < length) {
    return;
  }
  items.length = newLength;
  for (let i = length; i < newLength; i += 1) {
    items[i] = [];
  }
}
function addToLookup(
  lookup: Lookup,
  tag: string,
  layerIndex: number,
  item: LookupItem
): void {
  const layer = lookup[tag] || [];
  allocate(layer, layerIndex + 1);
  layer[layerIndex].push(item);
  lookup[tag] = layer;
}
function getTags(item: Item): string[] {
  return item.text.match(/#(\S+)/g) ?? [];
}
