import React from 'react';
import { Box } from 'rebass';
import { Item, ItemPosition, EMPTY_STACK } from '../App';
import { Layer } from "./Layer";

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
