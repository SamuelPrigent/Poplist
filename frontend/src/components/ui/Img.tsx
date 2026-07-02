import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Wrapper minimal qui mime l'API `<Image>` de `next/image`.
 *
 * Pas d'optimisation auto (le frontend Next avait déjà `images.unoptimized: true`),
 * on rend juste un `<img>` natif avec quelques mappings de props :
 *  - `priority`  → `loading="eager"` + `fetchPriority="high"`
 *  - `fill`      → position absolute + object-fit cover sur tout le parent (parent doit être relative)
 *  - `sizes`     → transmis tel quel au `<img>` natif (utilisé conjointement avec `srcSet`)
 *  - `srcSet`    → pass-through, à composer côté appelant (ex : helper `tmdbPosterSrcSet`)
 *
 * Note : à terme, remplacer chaque usage par un `<img>` direct serait plus
 * propre. Le wrapper existe pour minimiser les diffs pendant la migration.
 */
type ImgProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  srcSet?: string;
  // Props `next/image` héritées du frontend Next, ignorées ici (no-op).
  // Le frontend Next avait déjà `images.unoptimized: true`, donc pas de perte.
  unoptimized?: boolean;
  quality?: number;
};

export function Img({
  src,
  alt,
  width,
  height,
  priority,
  fill,
  sizes,
  srcSet,
  unoptimized: _unoptimized,
  quality: _quality,
  className,
  style,
  loading,
  fetchPriority,
  ...rest
}: ImgProps) {
  const fillStyle: CSSProperties = fill
    ? {
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }
    : {};

  return (
    <img
      {...rest}
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      sizes={sizes}
      srcSet={srcSet}
      // Un `loading`/`fetchPriority` explicite passé par l'appelant prime sur
      // la valeur dérivée de `priority` (avant, le spread {...rest} était
      // écrasé par ces attributs → loading="eager" ignoré, cf. bug des posters
      // du slide landing jamais chargés hors viewport sur mobile).
      loading={loading ?? (priority ? 'eager' : 'lazy')}
      fetchPriority={fetchPriority ?? (priority ? 'high' : 'auto')}
      decoding="async"
      className={cn(fill && 'object-cover', className)}
      style={{ ...fillStyle, ...style }}
    />
  );
}

export default Img;
