import React, { useState, useEffect } from 'react';
import Modal from '../../ui/Modal';
import Button from '../../ui/Button';
import { interactions } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext'; // To check if 'me'
import styles from './style.module.scss';
import { User } from 'lucide-react';
import { toast } from 'react-toastify';
import { useTranslation } from '@/i18n/client';
import Link from 'next/link';

const FollowListModal = ({ isOpen, onClose, username, type }) => {
    const { t } = useTranslation('common');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const { user: currentUser } = useAuth();

    useEffect(() => {
        if (isOpen && username) {
            fetchUsers();
        }
    }, [isOpen, username, type]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            let res;
            if (type === 'followers') {
                res = await interactions.getFollowers(username);
            } else {
                res = await interactions.getFollowing(username);
            }
            setUsers(res.data.results || res.data || []);
        } catch (err) {
            console.error(err);
            toast.error(t('follow_modal.load_failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (targetUser) => {
        try {
            if (targetUser.is_following) {
                await interactions.unfollowUser(targetUser.username);
                setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_following: false } : u));
                if (type === 'following' && currentUser?.username === username) {
                    // If viewing MY following list, removing it might be desired, but toggling state is safer/smoother UI.
                    // The user might want to re-follow immediately.
                    // But strictly speaking, it's no longer in "Following" list?
                    // Let's keep it in list but mark as not followed (so they can re-follow).
                }
                toast.success(`${t('follow_modal.unfollowed')} ${targetUser.username}`);
            } else {
                await interactions.followUser(targetUser.username);
                setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, is_following: true } : u));
                toast.success(`${t('follow_modal.followed')} ${targetUser.username}`);
            }
        } catch (err) {
            console.error(err);
            toast.error(t('follow_modal.action_failed'));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={type === 'followers' ? t('follow_modal.followers') : t('follow_modal.following')}>
            <div className={styles.modalContent}>
                {loading ? <p style={{ padding: '20px', textAlign: 'center' }}>{t('follow_modal.loading')}</p> : (
                    <>
                        {users.length === 0 && <p style={{ padding: '20px', textAlign: 'center', color: '#888' }}>{t('follow_modal.no_users')}</p>}
                        {users.map(u => (
                            <div key={u.id} className={styles.userRow}>
                                <Link href={`/user/${u.username}`} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, textDecoration: 'none', color: 'inherit' }}>
                                    {u.avatar ? (
                                        <img src={u.avatar} className={styles.avatar} alt={u.username} />
                                    ) : (
                                        <div className={styles.avatar} style={{ background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={20} color="#888" />
                                        </div>
                                    )}
                                    <div className={styles.userInfo}>
                                        <h4>{u.first_name} {u.last_name}</h4>
                                        <span>@{u.username}</span>
                                    </div>
                                </Link>
                                {currentUser && currentUser.username !== u.username && (
                                    <Button
                                        type={u.is_following ? "default" : "primary"}
                                        onClick={() => handleFollow(u)}
                                        className={styles.actionBtn}
                                        size="small"
                                    >
                                        {u.is_following ? t('follow_modal.unfollow') : t('follow_modal.follow')}
                                    </Button>
                                )}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default FollowListModal;
