import React from 'react';

export default function LogoMark({ size = 30, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Why The Code Is Like This Product Logo"
      className={`shrink-0 ${className}`}
    >
      {/* HISTORY TRACE PATH 1 (CODE -> HISTORY) */}
      <path
        d="M 6 25 L 14 12"
        stroke="#06B6D4"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200 group-hover:stroke-[#8B5CF6]"
      />

      {/* HISTORY TRACE PATH 2 (HISTORY -> DECISION) */}
      <path
        d="M 14 12 L 22 20"
        stroke="#8B5CF6"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200 group-hover:stroke-[#06B6D4]"
      />

      {/* REASONING RESOLUTION PATH (DECISION -> WHY) */}
      <path
        d="M 22 20 L 27 7"
        stroke="#06B6D4"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-colors duration-200 group-hover:stroke-[#F8FAFC]"
      />

      {/* NODE 1: CODE (Geometric Square Node) */}
      <rect
        x="3"
        y="22"
        width="6"
        height="6"
        rx="1.5"
        fill="#06B6D4"
        className="transition-colors duration-200 group-hover:fill-[#8B5CF6]"
      />

      {/* NODE 2: HISTORY (Circular Node) */}
      <circle
        cx="14"
        cy="12"
        r="2.75"
        fill="#8B5CF6"
        className="transition-colors duration-200 group-hover:fill-[#06B6D4]"
      />

      {/* NODE 3: DECISION (Circular Node) */}
      <circle
        cx="22"
        cy="20"
        r="2.75"
        fill="#06B6D4"
        className="transition-colors duration-200 group-hover:fill-[#8B5CF6]"
      />

      {/* NODE 4: WHY / REASONING RESOLUTION (Crisp White Node) */}
      <circle
        cx="27"
        cy="7"
        r="3"
        fill="#F8FAFC"
        className="transition-colors duration-200 group-hover:fill-[#06B6D4]"
      />
    </svg>
  );
}
