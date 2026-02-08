import { Film } from 'lucide-react'
import Image from 'next/image'
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

  if (posters.every(p => !p)) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Film strokeWidth={1.4} className="text-muted-foreground h-12 w-12" />
      </div>
    )
  }

  return (
    <div className="grid h-full w-full grid-cols-2 grid-rows-2 overflow-hidden">
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
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}
