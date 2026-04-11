import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import NoContent from '@/components/ui/NoContent';

const Section = ({ title, items, isOwner, onAdd, onEdit, onDelete, renderItem, layout = 'list' }) => {
    const { t } = useTranslation('common');
    const isCompact = layout === 'compact';

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{title}</h2>
                {isOwner && <Button size="small" onClick={onAdd}><Plus size={16} /> {t('profile.section_helper.add')}</Button>}
            </div>
            <div className={`${styles.list} ${isCompact ? styles.compactList : ''}`}>
                {items.map(item => (
                    <div key={item.id} className={`${styles.listItem} ${isCompact ? styles.compactItem : ''}`}>
                        {renderItem(item, isCompact)}
                        {isOwner && (
                            <div className={styles.itemActions}>
                                <Edit2 size={isCompact ? 14 : 16} color="#1890ff" style={{ cursor: 'pointer' }} onClick={() => onEdit(item)} />
                                <Trash2 size={isCompact ? 14 : 16} color="red" style={{ cursor: 'pointer' }} onClick={() => onDelete(item.id)} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {items.length === 0 && <NoContent message={t('profile.section_helper.no_items')} size="small" />}
        </div>
    );
};

export default Section;
