'use client';

import { Img as Image } from '@/components/ui/Img';
import { getWatchProviderLogo } from '@/api';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface Provider {
  name: string;
  logoPath: string;
}

function logoFor(name: string, logoPath?: string) {
  const local = getWatchProviderLogo(name);
  const tmdb = logoPath ? `https://image.tmdb.org/t/p/w92${logoPath}` : null;
  return { src: local?.path || tmdb, isLocal: !!local, className: local?.className };
}

// Filtre les plateformes affichables + déduplique par logo (les variantes
// "Netflix", "Netflix with Ads"... pointent vers le même logo).
export function getValidProviders(providers: Provider[]) {
  const seen = new Set<string>();
  return providers.filter(p => {
    if (!p || !p.name || !p.name.trim() || p.name.toLowerCase() === 'inconnu') return false;
    const { src } = logoFor(p.name, p.logoPath);
    if (!src) return false;
    if (seen.has(src)) return false;
    seen.add(src);
    return true;
  });
}

function MiniBubble({ name, logoPath, size }: { name: string; logoPath?: string; size: number }) {
  const { src, isLocal, className } = logoFor(name, logoPath);
  if (!src) return null;
  return (
    <div
      className="bg-muted relative shrink-0 overflow-hidden rounded-md"
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={name}
        fill
        sizes={`${size}px`}
        className={isLocal ? `object-contain ${className ?? 'p-1'}` : 'object-cover'}
        unoptimized={!isLocal}
      />
    </div>
  );
}

/**
 * Affichage compact des plateformes (cartes mobile) : JAMAIS de retour à la
 * ligne. Au-delà de 3, on montre 2 bulles + un carré "+N" qui ouvre une popover
 * listant de haut en bas toutes les plateformes disponibles (avec logo).
 */
export function CompactWatchProviders({
  providers,
  size = 24,
}: {
  providers: Provider[];
  size?: number;
}) {
  const valid = getValidProviders(providers);
  if (valid.length === 0) return null;

  const overflow = valid.length > 3;
  const visible = overflow ? valid.slice(0, 2) : valid;
  const hiddenCount = valid.length - visible.length;

  return (
    <div className="flex items-center gap-1.5">
      {visible.map((p, i) => (
        <MiniBubble key={`${p.name}-${i}`} name={p.name} logoPath={p.logoPath} size={size} />
      ))}
      {overflow && (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={e => e.stopPropagation()}
              className="bg-muted text-muted-foreground hover:text-foreground flex shrink-0 cursor-pointer items-center justify-center rounded-md text-[11px] font-semibold transition-colors"
              style={{ width: size, height: size }}
            >
              +{hiddenCount}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-2" align="end" side="top">
            <div className="space-y-0.5">
              {valid.map((p, i) => (
                <div key={`${p.name}-${i}`} className="flex items-center gap-2.5 px-1 py-1">
                  <MiniBubble name={p.name} logoPath={p.logoPath} size={26} />
                  <span className="truncate text-sm text-white">{p.name}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
