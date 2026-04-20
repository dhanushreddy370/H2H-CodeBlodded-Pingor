import React from 'react';

export const GooeyInput = ({ placeholder, value, onChange, className = "" }) => {
  return (
    <div className={`gooey-input-container ${className}`}>
      <svg width="0" height="0">
        <defs>
          <filter id="goo">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>
      <div className="input-blob-wrapper">
        <div className="blob"></div>
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="gooey-input-field"
        />
      </div>
    </div>
  );
};
