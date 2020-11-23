import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

export function Button(props) {
    const {active, disabled, onClick, bsStyle, bsSize, title, children} = props;
    const classes = ['btn', bsStyle && `btn-${bsStyle}`, bsSize && `btn-${normalizeSize(bsSize)}`, active && 'active'];
    return (
        <button type='button' disabled={disabled} onClick={onClick}
                className={classnames(classes)} title={title}>{children}</button>
    );
}

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

function normalizeSize(name) {
    if (name === 'xs' || name === 'xsmall') return 'xs';
    if (name === 'sm' || name === 'small') return 'sm';
    if (name === 'lg' || name === 'large') return 'lg';
    return 'block';
}
