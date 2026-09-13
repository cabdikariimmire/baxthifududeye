import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ value, onChange, placeholder = 'بحث...', onSearch, debounceMs = 350 }) => {
  const [localVal, setLocalVal] = useState(value || '');

  useEffect(() => {
    setLocalVal(value || '');
  }, [value]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (onChange && localVal !== value) {
        onChange(localVal);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [localVal, debounceMs]);

  const handleClear = () => {
    setLocalVal('');
    if (onChange) onChange('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(localVal);
    }
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full pr-10 pl-9 py-2 text-xs font-cairo bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-700/15 focus:border-teal-700 transition-all placeholder:text-slate-400 text-slate-800 shadow-2xs"
      />
      {localVal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          title="مسح البحث"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default SearchBar;
