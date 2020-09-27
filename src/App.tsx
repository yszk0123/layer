import React from 'react';
import { Box } from 'rebass';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import Xarrow from 'react-xarrows';
import { useDebouncedCallback } from 'use-debounce';
import { Card } from './components/Card';
import { AddCard } from './components/AddCard';
import { LayerCard } from './components/LayerCard';
import { translateKeyboard, Command } from './ShortcutCommand';

const SAVE_DEBOUNCE = 1000;
const STORAGE_KEY_STACK = 'stack';

export const colors = {
  highlight: 'rgba(0, 255, 255, 0.3)',
  changed: 'rgba(255, 128, 128, 0.3)',
};

type Item = { text: string };

type ItemPosition = { layerIndex: number; itemIndex: number };

type DragItem = {
  type: string;
  id: string;
  position: ItemPosition;
};
type DragLayer = {
  type: string;
  id: string;
  index: number;
};

const STACK: Item[][] = [[]];
const EMPTY_STACK: Item[][] = [[]];

enum ItemTypes {
  CARD = 'CARD',
  LAYER = 'LAYER',
}

type LookupItem = {
  item: Item;
  position: ItemPosition;
};
type Lookup = Record<string, LookupItem[][]>;

function getLookupKey(position: ItemPosition): string {
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

function generateLookup(stack: Item[][]): Array<[string, string]> {
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

type RedoableState<T> = {
  history: T[];
  count: number;
};
function cut<T>(items: T[], max: number): T[] {
  const length = items.length;
  return length <= max ? items : items.slice(length - max);
}
function useRedoableState<T>(initialValue: T, max: number = 100) {
  const [state, setState] = React.useState<RedoableState<T>>(() => ({
    history: [initialValue],
    count: 1,
  }));

  const commit = React.useCallback(
    (updator: (state: T) => T) => {
      setState((state) => {
        const value = state.history[state.count - 1];
        const nextHistory = cut(
          [...state.history.slice(0, state.count), updator(value)],
          max
        );
        return {
          history: nextHistory,
          count: nextHistory.length,
        };
      });
    },
    [max]
  );

  const undo = React.useCallback(() => {
    setState((state) => ({
      ...state,
      count: Math.max(state.count - 1, 1),
    }));
  }, []);

  const redo = React.useCallback(() => {
    setState((state) => ({
      ...state,
      count: Math.min(state.count + 1, state.history.length),
    }));
  }, []);

  const reset = React.useCallback((value: T) => {
    setState(() => {
      const nextHistory = [value];
      return {
        history: nextHistory,
        count: nextHistory.length,
      };
    });
  }, []);

  const latestValue = state.history[state.count - 1];

  return { state: latestValue, commit, undo, redo, reset };
}

export function App() {
  const {
    state: stack,
    commit: setStack,
    undo,
    redo,
    reset,
  } = useRedoableState(STACK);
  const handleDropItem = React.useCallback(
    (src: ItemPosition, dest: ItemPosition) => {
      setStack((stack) => {
        return moveItem(stack, src, dest);
      });
    },
    [setStack]
  );
  const handleDropLayer = React.useCallback(
    (src: number, dest: number) => {
      setStack((stack) => {
        return moveIn(stack, src, dest);
      });
    },
    [setStack]
  );
  const arrows = React.useMemo(() => generateLookup(stack), [stack]);

  const handleAddLayer = React.useCallback(
    (layerIndex: number) => {
      setStack((stack) => {
        return insertAfter(stack, layerIndex, []);
      });
    },
    [setStack]
  );

  const handleRemoveLayer = React.useCallback(
    (layerIndex: number) => {
      setStack((stack) => {
        return removeAt(stack, layerIndex);
      });
    },
    [setStack]
  );

  const handleAddItem = React.useCallback(
    (position: ItemPosition) => {
      setStack((stack) => {
        const newItem: Item = { text: '' };
        return updateAt(stack, position.layerIndex, (layer) =>
          insertAfter(layer, position.itemIndex, newItem)
        );
      });
    },
    [setStack]
  );

  const handleRemoveItem = React.useCallback(
    (position: ItemPosition) => {
      setStack((stack) => {
        return updateAt(stack, position.layerIndex, (layer) =>
          removeAt(layer, position.itemIndex)
        );
      });
    },
    [setStack]
  );

  const handleUpdateText = React.useCallback(
    (text: string, position: ItemPosition) => {
      setStack((stack) =>
        updateAt(stack, position.layerIndex, (layer) =>
          updateAt(layer, position.itemIndex, (item) => ({ ...item, text }))
        )
      );
    },
    []
  );
  const text = React.useMemo(() => stringify(stack), [stack]);

  const handleKeyDown = React.useCallback(
    async (event: React.KeyboardEvent | KeyboardEvent) => {
      const command = translateKeyboard(event);
      if (command !== Command.NONE) {
      }
      switch (command) {
        case Command.COPY:
          event.preventDefault();
          navigator.clipboard.writeText(text);
          break;
        case Command.PASTE:
          event.preventDefault();
          const clipboardText = await navigator.clipboard.readText();
          setStack(() => parse(clipboardText));
          break;
        case Command.UNDO:
          undo();
          break;
        case Command.REDO:
          redo();
          break;
      }
    },
    [text, setStack, undo, redo]
  );

  const debounced = useDebouncedCallback(() => {
    const data = JSON.stringify(text);
    localStorage.setItem(STORAGE_KEY_STACK, data);
  }, SAVE_DEBOUNCE);

  React.useEffect(() => {
    debounced.callback();
  }, [text]);

  React.useEffect(() => {
    const data = localStorage.getItem(STORAGE_KEY_STACK);
    try {
      reset(data !== null ? parse(JSON.parse(data)) : EMPTY_STACK);
    } catch (error) {
      console.error(error);
    }
  }, [reset]);

  React.useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return (
    <Box p={2}>
      {arrows.map(([from, to], i) => {
        return (
          <Xarrow
            key={i}
            path="smooth"
            startAnchor="bottom"
            endAnchor="top"
            start={from}
            end={to}
          />
        );
      })}
      <LayerStack
        stack={stack}
        onDropItem={handleDropItem}
        onDropLayer={handleDropLayer}
        onAddLayer={handleAddLayer}
        onRemoveLayer={handleRemoveLayer}
        onAddItem={handleAddItem}
        onRemoveItem={handleRemoveItem}
        onUpdateText={handleUpdateText}
      />
      <Box tabIndex={0} bg="lightgray" p={2}>
        <pre>{text}</pre>
      </Box>
    </Box>
  );
}

function stringify(stack: Item[][]): string {
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

function parse(input: string): Item[][] {
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

export function LayerStack({
  stack,
  onDropItem,
  onDropLayer,
  onAddLayer,
  onRemoveLayer,
  onAddItem,
  onRemoveItem,
  onUpdateText,
}: {
  stack: Item[][];
  onAddLayer: (layerIndex: number) => void;
  onRemoveLayer: (layerIndex: number) => void;
  onAddItem: (position: ItemPosition) => void;
  onRemoveItem: (position: ItemPosition) => void;
  onDropItem: (src: ItemPosition, dest: ItemPosition) => void;
  onDropLayer: (src: number, dest: number) => void;
  onUpdateText: (text: string, position: ItemPosition) => void;
}) {
  return (
    <Box>
      {(stack.length === 0 ? EMPTY_STACK : stack).map((items, i) => {
        return (
          <Layer
            key={i}
            items={items}
            index={i}
            onAddLayer={onAddLayer}
            onRemoveLayer={onRemoveLayer}
            onAddItem={onAddItem}
            onRemoveItem={onRemoveItem}
            onDropItem={onDropItem}
            onDropLayer={onDropLayer}
            onUpdateText={onUpdateText}
          />
        );
      })}
    </Box>
  );
}

export function Layer({
  items,
  index,
  onDropItem,
  onDropLayer,
  onAddLayer,
  onRemoveLayer,
  onAddItem,
  onRemoveItem,
  onUpdateText,
}: {
  items: Item[];
  index: number;
  onAddLayer: (layerIndex: number) => void;
  onRemoveLayer: (layerIndex: number) => void;
  onAddItem: (position: ItemPosition) => void;
  onRemoveItem: (position: ItemPosition) => void;
  onDropItem: (src: ItemPosition, dest: ItemPosition) => void;
  onDropLayer: (src: number, dest: number) => void;
  onUpdateText: (text: string, position: ItemPosition) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDropping }, dropItem] = useDrop({
    accept: ItemTypes.CARD,
    drop(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      if (monitor.didDrop()) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      const isAfter = hoverClientX >= hoverMiddleX;

      const srcPosition: ItemPosition = item.position;
      const destPosition: ItemPosition = {
        layerIndex: index,
        itemIndex: isAfter ? items.length - 1 : -1,
      };
      onDropItem(srcPosition, destPosition);
    },
    collect: (monitor) => ({
      isDropping: monitor.isOver({ shallow: true }),
    }),
  });

  const [{ isDroppingLayer }, dropLayer] = useDrop({
    accept: ItemTypes.LAYER,
    drop(layer: DragLayer, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }
      if (monitor.didDrop()) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const isAfter = hoverClientY >= hoverMiddleY;

      onDropLayer(layer.index, isAfter ? index : index - 1);
    },
    collect: (monitor) => ({
      isDroppingLayer: monitor.isOver({ shallow: true }),
    }),
  });

  const dragLayer: DragLayer = {
    type: ItemTypes.LAYER,
    id: String(index),
    index,
  };
  const [{ isDragging }, drag] = useDrag({
    item: dragLayer,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleAddLayer = React.useCallback(() => {
    onAddLayer(index);
  }, [index, onAddLayer]);

  const handleRemoveLayer = React.useCallback(() => {
    onRemoveLayer(index);
  }, [index, onRemoveLayer]);

  const handleAddItem = React.useCallback(() => {
    onAddItem({ layerIndex: index, itemIndex: items.length - 1 });
  }, [index, onAddItem, items]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        handleAddItem();
      }
    },
    [handleAddItem]
  );

  drag(dropLayer(dropItem(ref)));

  return (
    <LayerCard
      ref={ref}
      isHighlight={isDropping || isDragging || isDroppingLayer}
      onAddLayer={handleAddLayer}
      onRemoveLayer={handleRemoveLayer}
    >
      {items.map((item, i) => (
        <LayerItem
          key={`${i}-${item.text}`}
          item={item}
          position={{ layerIndex: index, itemIndex: i }}
          onDropItem={onDropItem}
          onAddItem={onAddItem}
          onRemoveItem={onRemoveItem}
          onUpdateText={onUpdateText}
        />
      ))}
      <AddCard onClick={handleAddItem} onKeyDown={handleKeyDown} />
    </LayerCard>
  );
}

export function LayerItem({
  item,
  position,
  onDropItem,
  onAddItem,
  onRemoveItem,
  onUpdateText,
}: {
  item: Item;
  position: ItemPosition;
  onAddItem: (position: ItemPosition) => void;
  onRemoveItem: (position: ItemPosition) => void;
  onDropItem: (src: ItemPosition, dest: ItemPosition) => void;
  onUpdateText: (text: string, position: ItemPosition) => void;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  const [{ isDropping }, drop] = useDrop({
    accept: ItemTypes.CARD,
    drop(item: DragItem, monitor: DropTargetMonitor) {
      if (!ref.current) {
        return;
      }

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleX =
        (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) {
        return;
      }
      const hoverClientX = clientOffset.x - hoverBoundingRect.left;
      const isAfter = hoverClientX >= hoverMiddleX;

      const srcPosition: ItemPosition = item.position;
      const destPosition: ItemPosition = {
        ...position,
        itemIndex: isAfter ? position.itemIndex : position.itemIndex - 1,
      };
      onDropItem(srcPosition, destPosition);
    },
    collect: (monitor) => ({
      isDropping: monitor.isOver(),
    }),
  });

  const dragItem: DragItem = {
    type: ItemTypes.CARD,
    id: item.text,
    position,
  };
  const [{ isDragging }, drag] = useDrag({
    item: dragItem,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const handleUpdateText = React.useCallback(
    (text: string) => {
      onUpdateText(text, position);
    },
    [onUpdateText, position]
  );

  const handleAddItem = React.useCallback(() => {
    onAddItem(position);
  }, [onAddItem, position]);

  const handleRemoveItem = React.useCallback(() => {
    onRemoveItem(position);
  }, [onRemoveItem, position]);

  drag(drop(ref));
  const id = getLookupKey(position);

  return (
    <Card
      id={id}
      ref={ref}
      isHighlight={isDragging || isDropping}
      value={item.text}
      onAddItem={handleAddItem}
      onRemoveItem={handleRemoveItem}
      onChange={handleUpdateText}
    />
  );
}

function moveItem(
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
function removeAt<T>(items: T[], index: number): T[] {
  return items.filter((_, i) => i !== index);
}
function moveIn<T>(items: T[], from: number, to: number): T[] {
  if (from === to || from === to + 1) {
    return items;
  }
  if (from > to) {
    return insertAfter(removeAt(items, from), to, items[from]);
  }
  return removeAt(insertAfter(items, to, items[from]), from);
}
function insertAfter<T>(items: T[], index: number, item: T): T[] {
  return [...items.slice(0, index + 1), item, ...items.slice(index + 1)];
}
function replaceAt<T>(items: T[], index: number, item: T): T[] {
  if (items[index] === item) {
    return items;
  }
  return [...items.slice(0, index), item, ...items.slice(index + 1)];
}
function updateAt<T>(items: T[], index: number, updator: (item: T) => T): T[] {
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
