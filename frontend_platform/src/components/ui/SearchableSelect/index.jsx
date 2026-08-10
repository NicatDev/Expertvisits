"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

import styles from './style.module.scss';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select...", labelKey = "name", professionKey = "profession", valueKey = "id", groupBy = null }) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const wrapperRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizeText = (text) => String(text || '')
        .toLocaleLowerCase('az')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ə/g, 'e')
        .replace(/ı/g, 'i')
        .trim();

    const currentLabel = (item) => item?.[professionKey] || item?.[labelKey] || item?.profession || item?.name || '';

    const searchableText = (item) => [
        item.profession_az,
        item.profession_en,
        item.profession_ru,
        item.name_az,
        item.name_en,
        item.name_ru,
        item.profession,
        item.name,
        item[labelKey],
        item[professionKey]
    ].filter(Boolean).map(normalizeText).join(' ');

    const filteredOptions = options.map(group => {
        const term = normalizeText(search);

        if (groupBy) {
            // For optgroup structures: { id, name, subcategories: [] }
            const subItems = [];
            
            group[groupBy].forEach(item => {
                // If search is empty, the list won't be shown anyway
                if (term.length === 0) return;

                if (searchableText(item).includes(term)) {
                    subItems.push({
                        ...item,
                        displayLabel: currentLabel(item),
                        displayKey: `${item[valueKey]}_${group.id}`
                    });
                }
            });

            if (subItems.length > 0) {
                return { ...group, [groupBy]: subItems };
            }
            return null;
        } else {
            // Flat list
            if (searchableText(group).includes(term)) return group;
            return null;
        }
    }).filter(Boolean);


    // Find selected label
    let selectedLabel = '';
    if (value) {
        if (groupBy) {
            for (const group of options) {
                const found = group[groupBy].find(i => i[valueKey] == value);
                if (found) {
                    selectedLabel = currentLabel(found);
                    break;
                }
            }
        } else {
            const found = options.find(i => i[valueKey] == value);
            if (found) selectedLabel = currentLabel(found);
        }
    }

    return (
        <div className={styles.container} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={styles.trigger}
            >
                <span className={selectedLabel ? styles.triggerText : `${styles.triggerText} ${styles.placeholder}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={14} color="#999" />
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchBox}>
                        <div className={styles.inputWrapper}>
                            <Search size={14} color="#999" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                autoFocus
                            />
                        </div>
                    </div>



                    {search.trim().length > 0 && (
                        <div className={styles.list}>
                        {filteredOptions.length === 0 ? (
                            <div className={styles.noOptions}>No options found.</div>
                        ) : (
                            filteredOptions.map((opt, i) => (
                                groupBy ? (
                                    <div key={opt.id || i}>
                                        <div className={styles.groupLabel}>
                                            {opt[labelKey] || opt.name}
                                        </div>
                                        {opt[groupBy].map(sub => (
                                            <div
                                                key={sub.displayKey || sub[valueKey]}
                                                onClick={() => {
                                                    onChange(sub[valueKey]);
                                                    setIsOpen(false);
                                                    setSearch('');
                                                }}
                                                className={`${styles.option} ${sub[valueKey] == value ? styles.selected : ''}`}
                                            >
                                                {sub.displayLabel || currentLabel(sub)}
                                                {sub[valueKey] == value && <Check size={14} />}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div
                                        key={opt[valueKey]}
                                        onClick={() => {
                                            onChange(opt[valueKey]);
                                            setIsOpen(false);
                                        }}
                                        className={styles.option}
                                    >
                                        {currentLabel(opt)}
                                    </div>
                                )
                            ))
                        )}
                    </div>
                    )}
                </div>
            )}
        </div>
    );
}
