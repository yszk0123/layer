import React from 'react';

type RedoableState<T> = {
  history: T[];
  count: number;
};

export function useRedoableState<T>(initialValue: T, max: number = 100) {
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

function cut<T>(items: T[], max: number): T[] {
  const length = items.length;
  return length <= max ? items : items.slice(length - max);
}
