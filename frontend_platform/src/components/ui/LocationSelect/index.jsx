"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { City, Country } from 'country-state-city';
import { MapPin, X } from 'lucide-react';

const LocationSelect = ({ value, onChange, placeholder = "Select City" }) => {
    const [options, setOptions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Load all countries to map isoCode to country name
        const countriesMap = Country.getAllCountries().reduce((acc, c) => {
            acc[c.isoCode] = c.name;
            return acc;
        }, {});

        // Load all cities and precompute displayName to format 'City, Country'
        const allCities = City.getAllCities().map(city => ({
            name: city.name,
            displayName: `${city.name}, ${countriesMap[city.countryCode] || city.countryCode}`,
            latitude: city.latitude,
            longitude: city.longitude
        }));
        setOptions(allCities);
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
                // Revert to chosen value or clear if not selected
                if (value) setSearchTerm(value);
                else setSearchTerm('');
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [value]);

    // Helper to normalize search input dealing with Azeri characters and aliases
    const normalizeText = (text) => {
        if (!text) return '';
        let t = text.toLowerCase().trim();

        return t
            .replace(/ə/g, 'a')
            .replace(/ö/g, 'o')
            .replace(/ğ/g, 'g')
            .replace(/ı/g, 'i')
            .replace(/ş/g, 'sh')
            .replace(/ç/g, 'ch')
            .replace(/ü/g, 'u');
    };

    // Use useMemo to avoid recalculating array filtering on every tiny render, and slice to max 50 to prevent DOM lag
    const filteredOptions = useMemo(() => {
        if (!searchTerm) return [];
        const normSearch = normalizeText(searchTerm);
        
        return options
            .filter(city => {
                const cityNorm = normalizeText(city.displayName);
                let matches = cityNorm.includes(normSearch);
                
                // Allow intuitive searching for standard Azerbaijani conventions without corrupting core logic
                if (!matches) {
                    if ((normSearch.includes('baki') || normSearch.includes('baku')) && cityNorm.includes('baku')) matches = true;
                    if ((normSearch.includes('ganc') || normSearch.includes('genc')) && cityNorm.includes('ganja')) matches = true;
                    if (normSearch.includes('naxchi') && cityNorm.includes('nakhch')) matches = true;
                    if (normSearch.includes('xirdal') && cityNorm.includes('khirdal')) matches = true;
                    if (normSearch.includes('shamax') && cityNorm.includes('shamakh')) matches = true;
                    if (normSearch.includes('lankar') && cityNorm.includes('lənkər')) matches = true; // if cityNorm somehow is lənkəran
                    if (normSearch.includes('mingech') && cityNorm.includes('mingach')) matches = true;
                }
                
                return matches;
            })
            .slice(0, 50);
    }, [options, searchTerm]);

    const handleSelect = (cityObj) => {
        onChange(cityObj.displayName); // Pass entire "City, Country" as selected value
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
                            onClick={() => handleSelect(city)}
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
