import React from 'react';
import styles from './style.module.scss';

const Avatar = ({ user, size = 48, className = '' }) => {
    const getInitial = () => {
        if (user?.first_name) return user.first_name[0].toUpperCase();
        if (user?.username) return user.username[0].toUpperCase();
        if (typeof user === 'string') return user[0].toUpperCase();
        return '?';
    };

    const colors = [
        '#FF5733', '#33FF57', '#3357FF', '#F333FF', '#33FFF3',
        '#FF3385', '#FF8533', '#8533FF', '#33FF85', '#3385FF',
        '#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1',
        '#eb2f96'
    ];

    const getBgColor = () => {
        const name = user?.first_name || user?.username || (typeof user === 'string' ? user : 'A');
        const charCode = name.charCodeAt(0);
        return colors[charCode % colors.length];
    };

    const main = user?.avatar || user?.author_avatar;
    const compressed = user?.avatar_compressed || user?.author_avatar_compressed;
    /* Yetim thumbnail (əsas silinib, sıxılmış qalıb) — göstərmə; yalnız əsas (sıxılmış gözləyir) — əsas şəkli göstər */
    let avatarUrl = null;
    if (main && compressed) avatarUrl = compressed || main;
    else if (main && !compressed) avatarUrl = main;
    else if (!main && compressed) avatarUrl = null;
    const altText = user?.first_name 
        ? `${user.first_name} ${user.last_name} - ${user?.profession_sub_category?.profession_en??'Professional'}`.trim() 
        : user?.username || (typeof user === 'string' ? user : 'User');

    if (avatarUrl) {
        return (
            <div 
                className={`${styles.avatarWrapper} ${className}`} 
                style={{ width: size, height: size }}
            >
                <img 
                    src={avatarUrl} 
                    alt={altText} 
                    className={styles.avatarImage} 
                />
            </div>
        );
    }

    return (
        <div 
            className={`${styles.avatarPlaceholder} ${className}`} 
            style={{ 
                width: size, 
                height: size, 
                backgroundColor: getBgColor(),
                fontSize: `${size * 0.4}px`
            }}
        >
            {getInitial()}
        </div>
    );
};

export default Avatar;
