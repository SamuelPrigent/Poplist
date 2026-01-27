'use client';

import { Loader2 } from 'lucide-react';
import { useLanguageStore } from '@/store/language';

interface SectionLoaderProps {
  height?: string;
}

export function SectionLoader({ height = 'h-[200px]' }: SectionLoaderProps) {
  const { content } = useLanguageStore();

  return (
    <div className={`flex ${height} w-full flex-col items-center justify-center gap-3`}>
      <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      <span className="text-muted-foreground text-sm">{content.watchlists.loading}</span>
    </div>
  );
}
