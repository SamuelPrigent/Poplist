'use client';

/**
 * Éléments hand-drawn SVG réutilisables pour les Hero Sections
 * Style authentique et humain pour mettre en valeur les mots-clés
 */

interface UnderlineProps {
  className?: string;
  color?: string;
  width?: number;
}

/**
 * Underline wavy avec effet hand-drawn
 */
export function WavyUnderline({ className = '', width = 200 }: UnderlineProps) {
  return (
    <svg
      width={width}
      height="12"
      viewBox="0 0 200 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M2 6C20 2 40 10 60 6C80 2 100 10 120 6C140 2 160 10 180 6C190 4 198 6 198 6"
        stroke="url(#wavy-gradient)"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="wavy-gradient" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Underline épais avec gradient (style moderne)
 */
export function ThickUnderline({ className = '', width = 200 }: UnderlineProps) {
  return (
    <svg
      width={width}
      height="8"
      viewBox="0 0 200 8"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <rect x="0" y="0" width="200" height="8" rx="4" fill="url(#thick-gradient)" />
      <defs>
        <linearGradient id="thick-gradient" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Cercle highlight hand-drawn autour d'un mot
 */
export function CircleHighlight({ className = '', width = 120 }: UnderlineProps) {
  return (
    <svg
      width={width}
      height="50"
      viewBox="0 0 120 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <ellipse
        cx="60"
        cy="25"
        rx="55"
        ry="20"
        stroke="#8b5cf6"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="4 2"
      />
    </svg>
  );
}

/**
 * Underline simple avec dégradé (sans wave)
 */
export function SimpleGradientUnderline({ className = '', width = 200 }: UnderlineProps) {
  return (
    <svg
      width={width}
      height="6"
      viewBox="0 0 200 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M2 3C50 4 150 2 198 3"
        stroke="url(#simple-gradient)"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="simple-gradient" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Underline brush stroke (coup de pinceau)
 */
export function BrushUnderline({ className = '', width = 200 }: UnderlineProps) {
  return (
    <svg
      width={width}
      height="14"
      viewBox="0 0 200 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="none"
    >
      <path
        d="M3 7C10 4 25 10 50 6C75 2 100 9 125 5C150 2 175 8 197 6"
        stroke="url(#brush-gradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="brush-gradient" x1="0" y1="0" x2="200" y2="0">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * Petit sparkle/étoile décorative
 */
export function Sparkle({ className = '', size = 24 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M12 2L13.5 9L20 12L13.5 15L12 22L10.5 15L4 12L10.5 9L12 2Z"
        fill="url(#sparkle-gradient)"
      />
      <defs>
        <linearGradient id="sparkle-gradient" x1="4" y1="2" x2="20" y2="22">
          <stop offset="0%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
    </svg>
  );
}
