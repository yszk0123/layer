import React from 'react';
import { Input, InputProps } from '@rebass/forms';
import { colors } from '../App';
import { translateKeyboard, Command } from '../ShortcutCommand';

export const Card = React.forwardRef(
  (
    {
      isHighlight,
      sx,
      onChange,
      value: initialValue,
      onAddItem,
      onRemoveItem,
      ...props
    }: Omit<InputProps, 'onChange'> & {
      onAddItem: () => void;
      onRemoveItem: () => void;
      onChange: (value: string) => void;
      isHighlight: boolean;
    },
    ref
  ) => {
    const [value, setValue] = React.useState(initialValue);

    const handleChange = React.useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setValue(event.currentTarget.value);
      },
      []
    );

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLInputElement>) => {
        const command = translateKeyboard(event);
        switch (command) {
          case Command.ADD:
            onAddItem();
            event.preventDefault();
            break;
          case Command.REMOVE:
            onRemoveItem();
            event.stopPropagation();
            break;
          case Command.UPDATE:
            onChange(event.currentTarget.value);
            event.preventDefault();
            break;
        }
        if (command !== Command.NONE) {
          event.stopPropagation();
        }
        return;
      },
      [onChange, onAddItem, onRemoveItem]
    );

    const handleBlur = React.useCallback(
      (event: React.FocusEvent<HTMLInputElement>) => {
        onChange(event.currentTarget.value);
      },
      [onChange]
    );

    const isChanged = value !== initialValue;

    const textSize = React.useMemo(
      () => (typeof value === 'string' ? getRoughTextSize(value) : 0),
      [value]
    );

    return (
      <Input
        ref={ref}
        onBlur={handleBlur}
        sx={{ ...sx, border: '1px solid gray' }}
        width={
          typeof value === 'string'
            ? `calc(${textSize + 1}ch + 1em)`
            : undefined
        }
        bg={
          isChanged
            ? colors.changed
            : isHighlight
            ? colors.highlight
            : undefined
        }
        m={2}
        tabIndex={0}
        p={2}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        value={value}
        {...props}
      />
    );
  }
);

// @see https://stackoverflow.com/a/12206089
function getUTF8Length(s: string): number {
  let len = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code <= 0x7f) {
      len += 1;
    } else if (code <= 0x7ff) {
      len += 2;
    } else if (code >= 0xd800 && code <= 0xdfff) {
      // Surrogate pair: These take 4 bytes in UTF-8 and 2 chars in UCS-2
      // (Assume next char is the other [valid] half and just skip it)
      len += 4;
      i++;
    } else if (code < 0xffff) {
      len += 3;
    } else {
      len += 4;
    }
  }
  return len;
}

function getRoughTextSize(s: string): number {
  let len = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code <= 0x7f) {
      len += 1;
    } else {
      len += 2;
    }
  }
  return len;
}
