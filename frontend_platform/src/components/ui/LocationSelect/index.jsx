"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, X } from 'lucide-react';
import {
    findCitiesMatchingSearch,
    isValidLocationDisplayName,
} from '@/lib/locationCatalog';

const LocationSelect = ({
    value,
    onChange,
    placeholder = "Select City",
    strict = false,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        if (value) {
            setSearchTerm(value);
        } else {
            setSearchTerm('');
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                if (strict) {
                    if (value && !isValidLocationDisplayName(value)) {
                        onChange('');
                        setSearchTerm('');
                        return;
                    }
                    if (value) {
                        setSearchTerm(value);
                    } else {
                        setSearchTerm('');
                    }
                    return;
                }
                if (value) setSearchTerm(value);
                else setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value, strict, onChange]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        return findCitiesMatchingSearch(searchTerm).slice(0, 50);
    }, [searchTerm]);

    const handleSelect = (cityObj) => {
        onChange(cityObj.displayName);
        setSearchTerm(cityObj.displayName);
        setIsOpen(false);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        onChange('');
        setSearchTerm('');
    };

    return (
        <div ref={wrapperRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder={placeholder}
                    style={{
                        width: '100%',
                        padding: '10px 10px 10px 36px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        outline: 'none'
                    }}
                />
                <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#999' }} />
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        style={{
                            position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                            background: 'none', border: 'none', cursor: 'pointer', color: '#999'
                        }}
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            {isOpen && filteredOptions.length > 0 && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    marginTop: '4px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    zIndex: 1000
                }}>
                    {filteredOptions.map((city) => (
                        <div
                            key={`${city.name}-${city.countryCode}-${city.latitude}-${city.longitude}`}
                            onClick={() => handleSelect(city)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleSelect(city);
                                }
                            }}
                            role="option"
                            tabIndex={0}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f5f5f5',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#f9f9f9'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'white'; }}
                        >
                            {city.displayName}
                        </div>
                    ))}
                </div>
            )}
            {isOpen && filteredOptions.length === 0 && searchTerm && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: 'white',
                    border: '1px solid #eee',
                    borderRadius: '8px',
                    marginTop: '4px',
                    padding: '10px',
                    color: '#999',
                    fontSize: '14px',
                    zIndex: 1000
                }}>
                    No cities found.
                </div>
            )}
        </div>
    );
};

export default LocationSelect;
