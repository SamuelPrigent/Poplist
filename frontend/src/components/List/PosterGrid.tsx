import { Film } from 'lucide-react'
import { Img as Image } from '@/components/ui/Img'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WatchlistItem } from '@/api'
import { getTMDBImageUrl } from '@/lib/utils'

interface PosterGridProps {
  items: WatchlistItem[]
  alt: string
  priority?: boolean
  /**
   * Priorité réseau des 4 posters, dérivée de l'ordre d'affichage de la card
   * ('high' pour les premières, 'low' pour celles du bas) : sous contention
   * réseau, les covers du haut de la grille chargent avant celles du bas.
   */
  fetchPriority?: 'high' | 'auto' | 'low'
  imageSize?: 'w92' | 'w154' | 'w185'
}

export function PosterGrid({
  items,
  alt,
  priority = false,
  fetchPriority,
  imageSize = 'w154',
}: PosterGridProps) {
  const posters = items.slice(0, 4).map(item => item.posterPath)

  // Pad to 4 slots
  while (posters.length < 4) {
    posters.push(null)
  }

  const expectedCount = posters.filter(Boolean).length
  const [loadedCount, setLoadedCount] = useState(0)
  const [forceReveal, setForceReveal] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Garde anti double comptage : une cellule peut être signalée par la ref
  // (image déjà complète) ET par onLoad — on ne la compte qu'une fois.
  const countedCells = useRef(new Set<number>())

  const allLoaded = forceReveal || loadedCount >= expectedCount

  const markLoaded = useCallback((cellIndex: number) => {
    if (countedCells.current.has(cellIndex)) return
    countedCells.current.add(cellIndex)
    setLoadedCount(prev => prev + 1)
  }, [])

  // La grille est rendue en SSR : les <img> téléchargent AVANT l'hydratation.
  // Quand React attache onLoad, une image peut déjà être complète → onLoad ne
  // fire jamais. Sans ce check via la ref, loadedCount n'atteignait jamais
  // expectedCount et TOUTES les cards attendaient leur timeout de secours de
  // 3 s — tous montés au même rendu, donc tous expirés au même instant : tout
  // « popait » pile en même temps, cache chaud ou pas.
  const makeCellRef = useCallback(
    (cellIndex: number) => (node: HTMLImageElement | null) => {
      if (node?.complete && node.naturalWidth > 0) {
        markLoaded(cellIndex)
      }
    },
    [markLoaded],
  )

  // Safety timeout — reveal after 3s regardless
  useEffect(() => {
    if (expectedCount === 0) return
    timeoutRef.current = setTimeout(() => setForceReveal(true), 3000)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [expectedCount])

  if (posters.every(p => !p)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Film strokeWidth={1.4} className="text-muted-foreground h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="relative grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden">
      {posters.map((posterPath, index) => (
        <div key={index} className="relative overflow-hidden bg-[#27272a]">
          {posterPath ? (
            <Image
              ref={makeCellRef(index)}
              src={getTMDBImageUrl(posterPath, imageSize) ?? ''}
              alt={`${alt} poster ${index + 1}`}
              fill
              sizes="(max-width: 768px) 25vw, 12vw"
              className="object-cover"
              priority={priority}
              fetchPriority={fetchPriority}
              unoptimized
              onLoad={() => markLoaded(index)}
              onError={() => markLoaded(index)}
            />
          ) : null}
        </div>
      ))}

      {/* Skeleton overlay — visible until all images loaded */}
      <div
        className={`bg-muted absolute inset-0 grid grid-cols-2 grid-rows-2 transition-opacity duration-200 ${
          allLoaded ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="bg-[#27272a]" />
        <div className="bg-[#2a2a2e]" />
        <div className="bg-[#2a2a2e]" />
        <div className="bg-[#27272a]" />
      </div>
    </div>
  )
}
