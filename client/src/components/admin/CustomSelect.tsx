/**
 * Custom Select Component
 * A styled dropdown select component
 */

import { useState, useRef, useEffect } from 'react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  disabled?: boolean;
  placeholder?: string;
  style?: React.CSSProperties;
}

export function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Select...',
  style,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (disabled) return;

    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        setIsOpen(!isOpen);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        } else {
          // Focus next option logic could be added here
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          // Focus previous option logic could be added here
        }
        break;
    }
  };

  return (
    <div
      ref={selectRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        ...style,
      }}
    >
      {/* Select Button */}
      <div
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        tabIndex={disabled ? -1 : 0}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        style={{
          padding: '0.5rem 2rem 0.5rem 0.75rem',
          borderRadius: '0.375rem',
          border: '2px solid #e2e8f0',
          backgroundColor: disabled ? '#f1f5f9' : '#fff',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: '0.875rem',
          fontWeight: 500,
          color: disabled ? '#94a3b8' : '#374151',
          opacity: disabled ? 0.7 : 1,
          transition: 'all 0.2s ease',
          outline: 'none',
          position: 'relative',
          minWidth: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: isOpen ? '0 0 0 3px rgba(37, 99, 235, 0.1)' : 'none',
          borderColor: isOpen ? '#2563eb' : '#e2e8f0',
        }}
      >
        <span style={{ 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          flex: 1,
        }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        
        {/* Dropdown Arrow */}
        <svg
          style={{
            position: 'absolute',
            right: '0.5rem',
            width: '16px',
            height: '16px',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            pointerEvents: 'none',
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#fff',
            border: '2px solid #e2e8f0',
            borderRadius: '0.375rem',
            boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
            marginTop: '0.25rem',
            overflow: 'hidden',
            animation: 'dropdownFadeIn 0.2s ease-out',
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              role="option"
              aria-selected={option.value === value}
              onClick={() => handleOptionClick(option.value)}
              style={{
                padding: '0.75rem',
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                color: option.value === value ? '#2563eb' : '#374151',
                backgroundColor: option.value === value ? '#f0f9ff' : 'transparent',
                transition: 'all 0.15s ease',
                borderBottom: '1px solid #f1f5f9',
              }}
              onMouseOver={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = '#f8fafc';
                }
              }}
              onMouseOut={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{option.label}</span>
                {option.value === value && (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}