import React from 'react';
import { useDrag, useDrop, DropTargetMonitor } from 'react-dnd';
import { Card } from './Card';
import { getLookupKey } from '../generateLookup';
import { Item, ItemPosition, ItemTypes, DragItem } from '../Stack';

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
