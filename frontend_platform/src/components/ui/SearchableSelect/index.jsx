"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

import styles from './styles.module.scss';

export default function SearchableSelect({ options, value, onChange, placeholder = "Select...", labelKey = "name", valueKey = "id", groupBy = null }) {
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

    const filteredOptions = options.map(group => {
        if (groupBy) {
            // For optgroup structures: { id, name, subcategories: [] }
            const filteredSubs = group[groupBy].filter(item =>
                (item.profession || item[labelKey]).toLowerCase().includes(search.toLowerCase())
            );
            if (filteredSubs.length > 0) {
                return { ...group, [groupBy]: filteredSubs };
            }
            return null;
        } else {
            // Flat list
            if ((group[labelKey]).toLowerCase().includes(search.toLowerCase())) return group;
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
                    selectedLabel = found.profession || found[labelKey];
                    break;
                }
            }
        } else {
            const found = options.find(i => i[valueKey] == value);
            if (found) selectedLabel = found[labelKey];
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

                    <div className={styles.list}>
                        {filteredOptions.length === 0 ? (
                            <div className={styles.noOptions}>No options found.</div>
                        ) : (
                            filteredOptions.map((opt, i) => (
                                groupBy ? (
                                    <div key={opt.id || i}>
                                        <div className={styles.groupLabel}>
                                            {opt.name}
                                        </div>
                                        {opt[groupBy].map(sub => (
                                            <div
                                                key={sub[valueKey]}
                                                onClick={() => {
                                                    onChange(sub[valueKey]);
                                                    setIsOpen(false);
                                                    setSearch('');
                                                }}
                                                className={`${styles.option} ${sub[valueKey] == value ? styles.selected : ''}`}
                                            >
                                                {sub.profession || sub[labelKey]}
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
                                        {opt[labelKey]}
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
