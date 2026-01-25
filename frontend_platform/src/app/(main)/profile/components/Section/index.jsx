import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import NoContent from '@/components/ui/NoContent';

const Section = ({ title, items, isOwner, onAdd, onEdit, onDelete, renderItem }) => {
    const { t } = useTranslation('common');
    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{title}</h2>
                {isOwner && <Button size="small" onClick={onAdd}><Plus size={16} /> {t('profile.section_helper.add')}</Button>}
            </div>
            <div className={styles.list}>
                {items.map(item => (
                    <div key={item.id} className={styles.listItem}>
                        {renderItem(item)}
                        {isOwner && (
                            <div className={styles.itemActions}>
                                <Edit2 size={16} color="#1890ff" style={{ cursor: 'pointer' }} onClick={() => onEdit(item)} />
                                <Trash2 size={16} color="red" style={{ cursor: 'pointer' }} onClick={() => onDelete(item.id)} />
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
