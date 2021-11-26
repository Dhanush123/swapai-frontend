import React from 'react';
import PropTypes from 'prop-types';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';

function GenericButton(props) {
  const colorStyle = {
    backgroundColor: (props.disabled) ? '#D3D3D3' : '#12824C',
    color: '#FFFFFF'
  }

  return (
    <Box display='flex' justifyContent='space-between' m={1}>
      <Button
        variant='contained'
        size='medium'
        style={colorStyle}
        onClick={props.onClick}
        disabled={props.disabled}
      >
        {props.label}
      </Button>
    </Box>
  );
}

GenericButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default React.memo(GenericButton);
