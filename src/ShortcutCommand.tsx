import React from 'react';

export enum Command {
  NONE = 'NONE',
  ADD = 'ADD',
  REMOVE = 'REMOVE',
  UPDATE = 'UPDATE',
  UNDO = 'UNDO',
  REDO = 'REDO',
  COPY = 'COPY',
  PASTE = 'PASTE',
}

export function translateKeyboard(
  event: React.KeyboardEvent | KeyboardEvent
): Command {
  if (event.shiftKey && event.key === 'Enter') {
    return Command.ADD;
  }
  if (event.shiftKey && event.key === 'Backspace') {
    return Command.REMOVE;
  }
  if (event.metaKey && event.key === 'Enter') {
    return Command.UPDATE;
  }
  if (!event.shiftKey && event.metaKey && event.key === 'z') {
    return Command.UNDO;
  }
  if (event.shiftKey && event.metaKey && event.key === 'z') {
    return Command.REDO;
  }
  if (event.metaKey && event.key === 'c') {
    return Command.COPY;
  }
  if (event.metaKey && event.key === 'v') {
    return Command.PASTE;
  }
  return Command.NONE;
}
