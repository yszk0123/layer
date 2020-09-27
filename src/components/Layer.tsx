import React from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { AddCard } from './AddCard';
import { LayerCard } from './LayerCard';
import {
  Item,
  ItemPosition,
  ItemTypes,
  DragItem,
  DragLayer,
} from '../App';
import { LayerItem } from "./LayerItem";

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
