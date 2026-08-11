import React, { useState } from 'react';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTranslation } from '@/i18n/client';
import styles from './style.module.scss';
import NoContent from '@/components/ui/NoContent';

const Section = ({ title, items, isOwner, onAdd, onEdit, onDelete, onReorder, renderItem, layout = 'list' }) => {
    const { t } = useTranslation('common');
    const isCompact = layout === 'compact';
    const [draggingId, setDraggingId] = useState(null);
    const canReorder = isOwner && typeof onReorder === 'function' && items.length > 1;

    const handleDrop = (targetId) => {
        if (!draggingId || draggingId === targetId) {
            setDraggingId(null);
            return;
        }
        const fromIndex = items.findIndex((item) => item.id === draggingId);
        const toIndex = items.findIndex((item) => item.id === targetId);
        if (fromIndex < 0 || toIndex < 0) {
            setDraggingId(null);
            return;
        }
        const nextItems = [...items];
        const [moved] = nextItems.splice(fromIndex, 1);
        nextItems.splice(toIndex, 0, moved);
        setDraggingId(null);
        onReorder(nextItems);
    };

    return (
        <div className={styles.section}>
            <div className={styles.sectionHeader}>
                <h2>{title}</h2>
                {isOwner && <Button size="small" onClick={onAdd}><Plus size={16} /> {t('profile.section_helper.add')}</Button>}
            </div>
            <div className={`${styles.list} ${isCompact ? styles.compactList : ''}`}>
                {items.map(item => (
                    <div
                        key={item.id}
                        className={`${styles.listItem} ${isCompact ? styles.compactItem : ''} ${draggingId === item.id ? styles.draggingItem : ''}`}
                        draggable={canReorder}
                        onDragStart={(event) => {
                            if (!canReorder) return;
                            setDraggingId(item.id);
                            event.dataTransfer.effectAllowed = 'move';
                            event.dataTransfer.setData('text/plain', String(item.id));
                        }}
                        onDragOver={(event) => {
                            if (canReorder) event.preventDefault();
                        }}
                        onDrop={(event) => {
                            event.preventDefault();
                            handleDrop(item.id);
                        }}
                        onDragEnd={() => setDraggingId(null)}
                    >
                        {canReorder ? (
                            <span className={styles.dragHandle} aria-hidden="true">
                                <GripVertical size={isCompact ? 14 : 16} />
                            </span>
                        ) : null}
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
