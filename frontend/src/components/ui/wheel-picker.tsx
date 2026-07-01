'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/cn';

const ITEM_H = 44;
const VISIBLE = 5; // impair : la ligne centrale est la valeur sélectionnée

/**
 * Roue de sélection (style iOS) pour le web, basée sur scroll-snap.
 * `onSettle` est appelé après stabilisation du scroll avec la valeur centrée.
 * `isDisabled` grise les valeurs invalides (elles restent scrollables mais
 * la logique de clamp côté parent empêche de s'y arrêter).
 */
export function WheelPicker({
  items,
  value,
  onSettle,
  isDisabled,
  ariaLabel,
}: {
  items: number[];
  value: number;
  onSettle: (value: number) => void;
  isDisabled?: (value: number) => boolean;
  ariaLabel?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const pad = ((VISIBLE - 1) / 2) * ITEM_H;

  // Recale la roue sur `value` quand elle change (montage + clamp externe).
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    const target = idx * ITEM_H;
    if (Math.abs(el.scrollTop - target) > 2) {
      el.scrollTo({ top: target, behavior: 'smooth' });
    }
  }, [value, items]);

  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = window.setTimeout(() => {
      const idx = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_H)));
      const v = items[idx];
      if (v !== value) onSettle(v);
    }, 130);
  };

  return (
    <div
      className="relative"
      style={{ height: VISIBLE * ITEM_H }}
      role="listbox"
      aria-label={ariaLabel}
    >
      <div
        ref={ref}
        onScroll={handleScroll}
        className="h-full snap-y snap-mandatory overflow-y-scroll [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]"
      >
        <div style={{ height: pad }} aria-hidden />
        {items.map(item => {
          const disabled = isDisabled?.(item);
          return (
            <div
              key={item}
              className={cn(
                'flex snap-center items-center justify-center text-2xl transition-colors',
                disabled
                  ? 'text-muted-foreground/15'
                  : value === item
                    ? 'text-foreground font-semibold'
                    : 'text-muted-foreground/70'
              )}
              style={{ height: ITEM_H }}
            >
              {item}
            </div>
          );
        })}
        <div style={{ height: pad }} aria-hidden />
      </div>
    </div>
  );
}
