import React from 'react';

interface BrandLogoProps {
  variant?: 'hero' | 'compact';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const isHero = variant === 'hero';

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <svg
        width={isHero ? 40 : 30}
        height={isHero ? 40 : 30}
        viewBox="0 0 36 36"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="2"
          y="2"
          width="32"
          height="32"
          rx="9"
          fill="#F96922"
        />
        <rect x="7" y="7" width="9.5" height="9.5" rx="2.5" fill="#111111" />
        <rect x="19.5" y="7" width="9.5" height="9.5" rx="2.5" fill="#F0F0F0" />
        <rect x="7" y="19.5" width="9.5" height="9.5" rx="2.5" fill="#F0F0F0" />
        <rect
          x="19.5"
          y="19.5"
          width="9.5"
          height="9.5"
          rx="2.5"
          fill="#111111"
          fillOpacity="0.45"
        />
        <path
          d="M14 22L22 14"
          stroke="#F96922"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      <div className="flex items-baseline gap-1.5 leading-none">
        <span
          className={`font-black tracking-tight text-[#F0F0F0] whitespace-nowrap ${
            isHero ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          BOLLYWOOD
        </span>
        <span
          className={`font-black tracking-tight text-[#F96922] whitespace-nowrap ${
            isHero ? 'text-2xl sm:text-3xl' : 'text-base sm:text-lg'
          }`}
          style={{ fontFamily: 'var(--font-display)' }}
        >
          CUT
        </span>
      </div>
    </div>
  );
};
