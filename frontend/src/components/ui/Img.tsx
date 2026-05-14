import type { CSSProperties, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Wrapper minimal qui mime l'API `<Image>` de `next/image`.
 *
 * Pas d'optimisation auto (le frontend Next avait déjà `images.unoptimized: true`),
 * on rend juste un `<img>` natif avec quelques mappings de props :
 *  - `priority`  → `loading="eager"` + `fetchPriority="high"`
 *  - `fill`      → position absolute + object-fit cover sur tout le parent (parent doit être relative)
 *  - `sizes`     → ignoré (utile uniquement avec l'optim Next)
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
  sizes: _sizes,
  unoptimized: _unoptimized,
  quality: _quality,
  className,
  style,
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
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
      className={cn(fill && 'object-cover', className)}
      style={{ ...fillStyle, ...style }}
    />
  );
}

export default Img;
