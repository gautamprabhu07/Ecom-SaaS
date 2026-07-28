// Path: apps/seller-ui/src/shared/components/sidebar/logo.tsx
import React from "react";

const Logo = () => {
  return (
    <svg
      width="140"
      height="36"
      viewBox="0 0 140 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Arch mark */}
      <path
        d="M4 30V16C4 8.268 10.268 2 18 2C25.732 2 32 8.268 32 16V30"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="30"
        x2="4"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <line
        x1="32"
        y1="30"
        x2="32"
        y2="34"
        stroke="#1A1A1A"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Wordmark */}
      <text
        x="44"
        y="25"
        fontFamily="'DM Serif Display', serif"
        fontSize="22"
        fill="#111110"
      >
        OutSource
      </text>
    </svg>
  );
};

export default Logo;
