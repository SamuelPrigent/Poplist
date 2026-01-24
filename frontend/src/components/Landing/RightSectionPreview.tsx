'use client';

import Image from 'next/image';

export function RightSectionPreview() {
  return (
    <div className="relative">
      <div className="border-border relative overflow-hidden rounded-[30px] border-4">
        {/* Real app screenshot */}
        <div className="relative aspect-9/6">
          <Image
            src="/preview/watchlists.png"
            alt="Apercu de l'application Poplist"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="relative top-[10px] left-[-21px] object-cover object-left"
            priority
          />
        </div>
        {/* Gradient fade overlay */}
        <div className="to-background pointer-events-none absolute inset-0 bg-linear-to-r from-transparent via-transparent"></div>
      </div>
    </div>
  );
}
