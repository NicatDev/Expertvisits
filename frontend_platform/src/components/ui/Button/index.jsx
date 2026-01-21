import React from 'react';
import styles from './styles.module.scss';

const Button = ({
    children,
    type = 'default', // primary, default, link
    htmlType = 'button',
    size = 'middle', // small, middle, large
    block = false,
    className = '',
    onClick,
    loading = false,
    icon,
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
            {loading ? <span className={styles.spinner}></span> : <>{icon} {children}</>}
        </button>
    );
};

export default Button;
