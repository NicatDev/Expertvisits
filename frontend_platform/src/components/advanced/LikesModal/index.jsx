import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, User } from 'lucide-react';
import api from '@/lib/api/client';
import styles from './style.module.scss';
import { useTranslation } from '@/i18n/client';

const LikesModal = ({ isOpen, onClose, contentType, objectId }) => {
    const { t } = useTranslation('common');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && objectId) {
            fetchLikes();
        }
    }, [isOpen, objectId]);

    const fetchLikes = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/interactions/likes/users/`, {
                params: { model: contentType, object_id: objectId }
            });
            setUsers(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>{t('likes_modal.title')}</h3>
                    <button onClick={onClose}><X size={20} /></button>
                </div>

                {loading ? <p>{t('likes_modal.loading')}</p> : (
                    <div className={styles.userList}>
                        {users.map((u, i) => (
                            <div key={i} className={styles.userItem}>
                                <div className={styles.avatar}>
                                    {u.avatar ? <img src={u.avatar} /> : <User size={16} color="#999" />}
                                </div>
                                <div className={styles.userInfo}>
                                    <span>{u.username}</span>
                                    <span className={styles.date}>{new Date(u.like_date).toLocaleDateString()}</span>
                                </div>
                            </div>
                        ))}
                        {users.length === 0 && <p>{t('likes_modal.no_likes')}</p>}
                    </div>
                )}
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default LikesModal;
