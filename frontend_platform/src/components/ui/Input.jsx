import React from 'react';
import styles from './Input.module.scss';

const Input = ({
    label,
    error,
    size = 'middle',
    className = '',
    wrapperStyle = {},
    ...props
}) => {
    return (
        <div className={styles.wrapper} style={wrapperStyle}>
            {label && <label className={styles.label}>{label}</label>}
            <input
                className={`${styles.input} ${styles[size]} ${error ? styles.error : ''} ${className}`}
                {...props}
            />
            {error && <span className={styles.errorMessage}>{error}</span>}
        </div>
    );
};

export default Input;
