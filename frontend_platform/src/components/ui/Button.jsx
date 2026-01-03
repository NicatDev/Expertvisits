import React from 'react';
import styles from './Button.module.scss';

const Button = ({
    children,
    type = 'default', // primary, default, link
    htmlType = 'button',
    size = 'middle', // small, middle, large
    block = false,
    className = '',
    onClick,
    loading = false,
    ...props
}) => {
    const classes = [
        styles.button,
        styles[type],
        styles[size],
        block ? styles.block : '',
        className
    ].join(' ');

    return (
        <button
            type={htmlType}
            className={`${classes} ${loading ? styles.loading : ''}`}
            onClick={loading ? undefined : onClick}
            disabled={loading || props.disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
