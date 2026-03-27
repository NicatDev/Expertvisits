"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

import styles from './styles.module.scss';

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

    const filteredOptions = options.map(group => {
        if (groupBy) {
            // For optgroup structures: { id, name, subcategories: [] }
            const subItems = [];
            
            group[groupBy].forEach(item => {
                const term = search.toLowerCase().trim();
                
                // If search is empty, the list won't be shown anyway
                if (term.length === 0) return;

                // Define variants: AZ, EN, RU
                const variants = [
                    { label: item.profession_az || item.name_az, lang: 'az' },
                    { label: item.profession_en || item.name_en, lang: 'en' },
                    { label: item.profession_ru || item.name_ru, lang: 'ru' }
                ].filter(v => v.label);

                // For each variant, check if it matches the search term
                variants.forEach(v => {
                    if (v.label.toLowerCase().includes(term)) {
                        subItems.push({
                            ...item,
                            displayLabel: v.label,
                            displayKey: `${item[valueKey]}_${v.lang}_${group.id}` 
                        });
                    }
                });
            });

            if (subItems.length > 0) {
                return { ...group, [groupBy]: subItems };
            }
            return null;
        } else {
            // Flat list
            const searchableString = [
                group.name_az, group.name_en, group.name_ru,
                group.name, group[labelKey]
            ].filter(Boolean).join(' ').toLowerCase();
            
            if (searchableString.includes(search.toLowerCase())) return group;
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
                    selectedLabel = found[professionKey] || found[labelKey] || found.profession || found.name;
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
                                                {sub.displayLabel || sub[professionKey] || sub[labelKey] || sub.profession || sub.name}
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
                                        {opt[labelKey] || opt.name}
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
