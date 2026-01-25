import React from 'react';
import styles from './Switch.module.scss';

const Switch = ({ checked, onChange, disabled }) => {
    return (
        <label className={`${styles.switch} ${disabled ? styles.disabled : ''}`}>
            <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
            <span className={styles.slider}></span>
        </label>
    );
};

export default Switch;
