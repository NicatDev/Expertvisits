"use client";
import React, { useState, useEffect, useRef } from 'react';
import { City } from 'country-state-city';
import { MapPin, X } from 'lucide-react';

const LocationSelect = ({ value, onChange, placeholder = "Select City" }) => {
    const [options, setOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Load cities on mount
        // We can optimize by loading only when focused or typing if list is huge
        // Azerbaijan code is 'AZ'
        const cities = City.getCitiesOfCountry('AZ');
        setOptions(cities);
    }, []);

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
                // If user typed something but didn't select, revert to value (or keep it if we want free text)
                // Let's enforce selection for now to match IDs/Standard names, but simpler to just revert
                if (value) setSearchTerm(value);
                else setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    const filteredOptions = options.filter(city =>
        city.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelect = (cityName) => {
        onChange(cityName);
        setSearchTerm(cityName);
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
                    onChange={(e) => { setSearchTerm(e.target.value); setIsOpen(true); }}
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
                            key={`${city.name}-${city.latitude}`} // Some names might be dupes?
                            onClick={() => handleSelect(city.name)}
                            style={{
                                padding: '10px 12px',
                                cursor: 'pointer',
                                fontSize: '14px',
                                borderBottom: '1px solid #f5f5f5',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.target.style.background = '#f9f9f9'}
                            onMouseLeave={(e) => e.target.style.background = 'white'}
                        >
                            {city.name}
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
