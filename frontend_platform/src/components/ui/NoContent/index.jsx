import React from 'react';
import { Inbox } from 'lucide-react';
import styles from './style.module.scss';

const NoContent = ({ message, icon: Icon = Inbox, size = 'default' }) => {
    return (
        <div className={`${styles.wrapper} ${styles[size]}`}>
            <Icon className={styles.icon} size={48} strokeWidth={1.5} />
            <p>{message || "No content available."}</p>
        </div>
    );
};

export default NoContent;
