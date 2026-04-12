import { Film } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { WatchlistItem } from '@/lib/api-client'

interface PosterGridProps {
  items: WatchlistItem[]
  alt: string
  priority?: boolean
  imageSize?: 'w92' | 'w154' | 'w185'
}

export function PosterGrid({ items, alt, priority = false, imageSize = 'w154' }: PosterGridProps) {
  const posters = items.slice(0, 4).map(item => item.posterPath)

  // Pad to 4 slots
  while (posters.length < 4) {
    posters.push(null)
  }

  const expectedCount = posters.filter(Boolean).length
  const [loadedCount, setLoadedCount] = useState(0)
  const [forceReveal, setForceReveal] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const allLoaded = forceReveal || loadedCount >= expectedCount

  const handleLoaded = useCallback(() => {
    setLoadedCount(prev => prev + 1)
  }, [])

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
              src={`https://image.tmdb.org/t/p/${imageSize}${posterPath}`}
              alt={`${alt} poster ${index + 1}`}
              fill
              sizes="(max-width: 768px) 25vw, 12vw"
              className="object-cover"
              priority={priority}
              unoptimized
              onLoad={handleLoaded}
              onError={handleLoaded}
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
