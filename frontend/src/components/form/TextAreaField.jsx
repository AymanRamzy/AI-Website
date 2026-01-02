import React from 'react';

const TextAreaField = ({
  label,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  minLength,
  maxLength
}) => {
  return (
    <div className="mb-6">
      {label && (
        <label className="block mb-2 font-semibold text-gray-700">
          {label}
        </label>
      )}

      <textarea
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        minLength={minLength}
        maxLength={maxLength}
      />

      {maxLength && (
        <div className="text-sm text-gray-500 mt-1">
          {value?.length || 0} / {maxLength}
        </div>
      )}
    </div>
  );
};

export default TextAreaField;
