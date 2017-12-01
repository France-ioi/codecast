
import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export function Button (props) {
  const {active, disabled, onClick, bsStyle, title, children} = props;
  const classes = ['btn', bsStyle && `btn-${bsStyle}`, active && 'active'];
  return (
    <button type='button' disabled={disabled} onClick={onClick}
      className={classnames(classes)} title={title} >{children}</button>
  );
};

Button.propTypes = {
  active: PropTypes.bool,
  bsStyle: PropTypes.string,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  title: PropTypes.string,
};

Button.defaultProps = {
  active: false,
  disabled: false,
  bsStyle: 'default'
};
