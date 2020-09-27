import React from 'react';
import { Box, BoxProps } from 'rebass';

export const AddCard = React.forwardRef(({ sx, ...props }: BoxProps, ref) => {
  return (
    <Box
      ref={ref}
      sx={{ ...sx, border: '1px solid gray' }}
      m={2}
      tabIndex={0}
      p={2}
      {...props}
    >
      +
    </Box>
  );
});
