"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api/client';
import styles from './style.module.scss';
import { User } from 'lucide-react';
import { toast } from 'react-toastify';
import { interactions } from '@/lib/api';

const RecommendedUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Fetch users ordered by followers count desc
            const { data } = await api.get('/accounts/users/', {
                params: {
                    ordering: '-followers_count',
                }
            });
            const list = data.results || data;
            setUsers(list.filter(u => u.username).slice(0, 5));
        } catch (error) {
            console.error("Failed to load users", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFollow = async (user) => {
        if (!user.is_following) {
         toast.error("You must be logged in to follow users");   
         return;
        }
        try {
            if (user.is_following) {
                await interactions.unfollowUser(user.username);
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_following: false, followers_count: u.followers_count - 1 } : u));
            } else {
                await interactions.followUser(user.username);
                setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_following: true, followers_count: u.followers_count + 1 } : u));
            }
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) return <div className={styles.container}>Loading...</div>;
    if (users.length === 0) return null;

    return (
        <div className={styles.container}>
            <h3 className={styles.title}>Recommended Users</h3>
            <div className={styles.list}>
                {users.map(user => (
                    <div key={user.id} className={styles.item}>
                        <div className={styles.avatar}>
                            {user.avatar ? <img src={user.avatar} alt={user.username} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={20} color="#999" /></div>}
                        </div>
                        <div className={styles.info}>
                            <Link href={`/user/${user.username}`} className={styles.name}>
                                {user.first_name} {user.last_name}
                            </Link>
                            <span className={styles.followers} style={{ color: '#999', fontSize: '12px' }}>
                                {user.profession_sub_category?.profession || user.profession_sub_category?.name || 'User'}
                            </span>
                        </div>
                        <button
                            className={`${styles.followBtn} ${user.is_following ? styles.following : ''}`}
                            onClick={() => handleFollow(user)}
                        >
                            {user.is_following ? 'Unfollow' : 'Follow'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RecommendedUsers;
