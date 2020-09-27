import React from 'react';
import { Box } from 'rebass';
import Xarrow from 'react-xarrows';
import { useDebouncedCallback } from 'use-debounce';
import { translateKeyboard, Command } from './ShortcutCommand';
import { useRedoableState } from './hooks/useRedoableState';
import { generateLookup } from './generateLookup';
import { LayerStack } from './components/LayerStack';
import {
  Item,
  ItemPosition,
  EMPTY_STACK,
  moveItem,
  parseStack,
  stringifyStack,
} from './Stack';
import {
  moveIn,
  insertAfter,
  removeAt,
  updateAt,
  replaceAt,
} from './ArrayUtils';

const SAVE_DEBOUNCE = 1000;
const STORAGE_KEY_STACK = 'stack';
const STACK: Item[][] = [[]];

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
  const text = React.useMemo(() => stringifyStack(stack), [stack]);

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
          setStack(() => parseStack(clipboardText));
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
      reset(data !== null ? parseStack(JSON.parse(data)) : EMPTY_STACK);
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
