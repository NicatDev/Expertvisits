import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './style.module.scss';

const TagsInput = ({
    label,
    placeholder,
    tags = [],
    onChange,
    disabled = false,
    source = [] // Array of strings or { name: string, ... }
}) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = (e) => {
        const val = e.target.value;
        setInput(val);

        if (source.length > 0 && val.trim().length > 0) {
            // Check if source items are strings or objects
            const isString = typeof source[0] === 'string';
            const lowerVal = val.toLowerCase();

            const filtered = source.filter(item => {
                const str = isString ? item : (item.name || item.name_en || '');
                return str.toLowerCase().includes(lowerVal);
            }).slice(0, 10); // Limit to 10

            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const addTag = (val) => {
        const trimmed = val.trim();
        if (trimmed && !tags.includes(trimmed)) {
            onChange([...tags, trimmed]);
            setInput('');
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            // If suggestions visible and one matches exactly or first one?
            // User requirement: "exc yazim excell cixsin ve entere vuranda secilsin" -> implies selecting first match?
            // Or just adds what is typed? Usually Enter adds what is typed unless selected.
            // But if there are suggestions, usually ArrowDown + Enter selects.
            // I'll implement: Enter adds input value.
            addTag(input);
        } else if (e.key === 'Backspace' && !input && tags.length > 0) {
            onChange(tags.slice(0, -1));
        }
    };

    const removeTag = (tagToRemove) => {
        onChange(tags.filter(tag => tag !== tagToRemove));
    };

    const selectSuggestion = (item) => {
        const val = typeof item === 'string' ? item : (item.name || item.name_en);
        addTag(val);
    };

    return (
        <div className={styles.wrapper} ref={containerRef}>
            {label && <label className={styles.label}>{label}</label>}
            <div className={`${styles.container} ${disabled ? styles.disabled : ''} `}>
                <div className={styles.tagsArea}>
                    {tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>
                            {tag}
                            <button
                                type="button"
                                onClick={() => removeTag(tag)}
                                className={styles.removeBtn}
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                    <input
                        type="text"
                        className={styles.input}
                        placeholder={tags.length === 0 ? placeholder : ''}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        disabled={disabled}
                        onFocus={() => input && suggestions.length > 0 && setShowSuggestions(true)}
                    />
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <div className={styles.suggestions}>
                        {suggestions.map((item, idx) => {
                            const val = typeof item === 'string' ? item : (item.name || item.name_en);
                            return (
                                <div
                                    key={idx}
                                    className={styles.suggestionItem}
                                    onClick={() => selectSuggestion(item)}
                                >
                                    {val}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TagsInput;
