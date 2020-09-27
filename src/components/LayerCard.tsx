import React from 'react';
import { Box, BoxProps } from 'rebass';
import { colors } from "../theme";
import { translateKeyboard, Command } from '../ShortcutCommand';

export const LayerCard = React.forwardRef(
  (
    {
      isHighlight,
      onAddLayer,
      onRemoveLayer,
      ...props
    }: BoxProps & {
      isHighlight: boolean;
      onAddLayer: () => void;
      onRemoveLayer: () => void;
    },
    ref
  ) => {
    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLDivElement>) => {
        const command = translateKeyboard(event);
        switch (command) {
          case Command.ADD:
            onAddLayer();
            event.preventDefault();
            break;
          case Command.REMOVE:
            onRemoveLayer();
            event.preventDefault();
            break;
        }
        if (command !== Command.NONE) {
          event.stopPropagation();
        }
      },
      [onAddLayer, onRemoveLayer]
    );

    return (
      <Box
        ref={ref}
        tabIndex={0}
        sx={{ border: '1px solid blue', display: 'flex' }}
        bg={isHighlight ? colors.highlight : undefined}
        mb={4}
        py={2}
        onKeyDown={handleKeyDown}
        {...props}
      />
    );
  }
);
