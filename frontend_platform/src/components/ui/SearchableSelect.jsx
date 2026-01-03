"use client";
import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';

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
        <div className="searchable-select" ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '8px 12px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    cursor: 'pointer',
                    background: '#fff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '14px',
                    minHeight: '38px'
                }}
            >
                <span style={{ color: selectedLabel ? '#333' : '#999' }}>{selectedLabel || placeholder}</span>
                <ChevronDown size={14} color="#999" />
            </div>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#fff',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    zIndex: 1000,
                    marginTop: '4px',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', padding: '4px 8px' }}>
                            <Search size={14} color="#999" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search..."
                                style={{ border: 'none', outline: 'none', padding: '4px', width: '100%', fontSize: '13px' }}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                        {filteredOptions.length === 0 ? (
                            <div style={{ padding: '8px 12px', color: '#999', fontSize: '13px' }}>No options found.</div>
                        ) : (
                            filteredOptions.map((opt, i) => (
                                groupBy ? (
                                    <div key={opt.id || i}>
                                        <div style={{ padding: '6px 12px', background: '#f5f5f5', fontSize: '11px', fontWeight: 'bold', color: '#666', textTransform: 'uppercase' }}>
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
                                                style={{
                                                    padding: '8px 12px',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    color: sub[valueKey] == value ? '#1890ff' : '#333',
                                                    background: sub[valueKey] == value ? '#e6f7ff' : 'transparent',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                                className="select-item"
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
                                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '13px' }}
                                        className="select-item"
                                    >
                                        {opt[labelKey]}
                                    </div>
                                )
                            ))
                        )}
                    </div>
                </div>
            )}
            <style jsx>{`
                .select-item:hover {
                    background-color: #f0f0f0 !important;
                }
            `}</style>
        </div>
    );
}
