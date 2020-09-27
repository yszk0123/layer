export function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}

export function moveIn<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from === to + 1) {
    return items;
  }
  if (from > to) {
    return insertAfter(removeAt(items, from), to, items[from]);
  }
  return removeAt(insertAfter(items, to, items[from]), from);
}

export function insertAfter<T>(items: T[], index: number, item: T): T[] {
  return [...items.slice(0, index + 1), item, ...items.slice(index + 1)];
}

export function replaceAt<T>(items: T[], index: number, item: T): T[] {
  if (items[index] === item) {
    return items;
  }
  return [...items.slice(0, index), item, ...items.slice(index + 1)];
}

export function updateAt<T>(
  items: T[],
  index: number,
  updator: (item: T) => T
): T[] {
  const newItem = updator(items[index]);
  if (items[index] === newItem) {
    return items;
  }
  return [...items.slice(0, index), newItem, ...items.slice(index + 1)];
}

function swapIn<T>(items: T[], i: number, j: number): T[] {
  const result: T[] = [...items];
  result[i] = items[j];
  result[j] = items[i];
  return result;
}
