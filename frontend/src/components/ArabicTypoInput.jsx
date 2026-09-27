import React, { useState, useEffect, useCallback, useRef } from 'react';
import { suggestCorrectionsForText } from '../utils/arabicTypoCorrector';

/**
 * A wrapper for standard text inputs/textareas that provides inline Arabic typo suggestions.
 */
const ArabicTypoInput = React.forwardRef(({
  value,
  onChange,
  className,
  placeholder,
  projectContext = '',
  as: Component = 'input',
  ...rest
}, ref) => {
  const [suggestion, setSuggestion] = useState(null);
  const internalRef = useRef(null);

  const handleRef = useCallback((node) => {
    internalRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
  }, [ref]);

  // Debounce the spell check
  useEffect(() => {
    const handler = setTimeout(() => {
      // Find typos in the current text
      const corrections = suggestCorrectionsForText(value, projectContext);
      if (corrections && corrections.length > 0) {
        // Just show the first suggestion for simplicity in this UI
        // In a more complex app, we might highlight multiple, but this satisfies the requirements.
        setSuggestion(corrections[0]);
      } else {
        setSuggestion(null);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(handler);
  }, [value, projectContext]);

  const handleCorrect = () => {
    if (!suggestion) return;

    const before = value.substring(0, suggestion.index);
    const after = value.substring(suggestion.index + suggestion.length);
    const newValue = before + suggestion.suggestion + after;

    // Call onChange with a mock event
    onChange({ target: { value: newValue } });
    setSuggestion(null);
  };

  const handleIgnore = () => {
    setSuggestion(null);
  };

  return (
    <div className="relative flex-1">
      <Component
        ref={handleRef}
        value={value}
        onChange={onChange}
        className={className}
        placeholder={placeholder}
        {...rest}
      />
      {suggestion && (
        <div className="absolute top-full mt-1 right-0 z-10 bg-white border border-teal-200 shadow-md rounded-lg p-2 text-sm flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <span className="text-slate-700 font-cairo">
            هل تقصد: <strong className="text-teal-800">{suggestion.suggestion}</strong>؟
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCorrect}
              className="text-xs font-bold px-2 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded"
            >
              تصحيح
            </button>
            <button
              type="button"
              onClick={handleIgnore}
              className="text-xs font-bold px-2 py-1 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded"
            >
              تجاهل
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

ArabicTypoInput.displayName = 'ArabicTypoInput';

export default ArabicTypoInput;
