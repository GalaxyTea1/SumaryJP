import { useState, useEffect, useRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: SelectOption[];
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function CustomSelect({
  value,
  onChange,
  options,
  disabled = false,
  className = '',
  placeholder = 'Chọn một mục'
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll to selected option when opened
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const selectedEl = dropdownRef.current.querySelector('[data-selected="true"]');
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }, [isOpen]);

  const handleSelect = (val: string | number) => {
    if (disabled) return;
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between pl-3 pr-3.5 py-2.5 text-sm border rounded-xl bg-white transition-all text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20
          ${isOpen ? 'border-primary ring-2 ring-primary/20 shadow-sm' : 'border-outline-variant shadow-sm'}
          ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-dim' : 'hover:border-primary/60'}
        `}
      >
        <span className={`truncate ${!selectedOption ? 'text-on-surface-variant' : 'text-on-surface font-medium'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className={`material-symbols-outlined text-lg text-on-surface-variant transition-transform duration-200 select-none ${isOpen ? 'rotate-180' : ''}`}>
          keyboard_arrow_down
        </span>
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-20 left-0 right-0 mt-1.5 max-h-60 overflow-y-auto bg-white border border-outline-variant rounded-xl shadow-lg py-1 animate-fade-in focus:outline-none scrollbar-thin"
        >
          {options.length === 0 ? (
            <div className="px-4 py-2.5 text-xs text-on-surface-variant text-center">
              Không có lựa chọn nào
            </div>
          ) : (
            options.map(opt => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-selected={isSelected}
                  onClick={() => handleSelect(opt.value)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors cursor-pointer flex items-center justify-between
                    ${isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'text-on-surface hover:bg-surface-dim'
                    }
                  `}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && (
                    <span className="material-symbols-outlined text-base text-primary select-none">
                      check
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
