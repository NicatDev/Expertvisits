import React from 'react';
import styles from './style.module.scss';

const Input = ({
    label,
    error,
    size = 'middle',
    className = '',
    wrapperStyle = {},
    value,
    ...props
}) => {
    // React: controlled inputs must not use value={null}; avoid switching undefined ↔ defined
    const resolvedValue = value === null ? '' : value;
    const inputProps =
        value !== undefined ? { ...props, value: resolvedValue } : props;

    return (
        <div className={styles.wrapper} style={wrapperStyle}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                className={`${styles.input} ${styles[size]} ${error ? styles.error : ''} ${className}`}
                {...inputProps}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
