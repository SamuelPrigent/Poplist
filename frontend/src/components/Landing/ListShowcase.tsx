import { Img as Image } from '@/components/ui/Img';
import { cn } from '@/lib/cn';

/**
 * Un paquet de cartes de listes, posé.
 *
 * Trois vraies cartes de liste (mêmes proportions que `ListCard` produit :
 * cover carrée 2×2, titre, compteur), empilées avec de légers angles, la
 * première bien à plat au-dessus. L'image raconte « des listes qu'on crée »
 * sans occuper la moitié de l'écran : c'est volontairement bas en hauteur.
 */

const TMDB = 'https://image.tmdb.org/t/p/w154';

type Deck = {
  title: string;
  count: number;
  covers: string[];
  className: string;
  dim?: boolean;
};

const DECK: Deck[] = [
  // Dessous, à gauche, penchée
  {
    title: 'Nostalgie',
    count: 15,
    covers: [
      `${TMDB}/pVLoHNIzKRj75YikaKAcj1d96JS.jpg`,
      `${TMDB}/iCgFtDUZxN8iUzNBCisjUrBmg2q.jpg`,
      `${TMDB}/3nqpcTkODCBhuKuDQJ1dtRhgTqZ.jpg`,
      `${TMDB}/5DmmWDmfEeqeXREEfV0M5AMzfNK.jpg`,
    ],
    className: '-rotate-8 -translate-x-[58%] translate-y-[10%] z-10',
    dim: true,
  },
  // Dessous, à droite, penchée dans l'autre sens
  {
    title: 'Séries en cours',
    count: 9,
    covers: [
      `${TMDB}/hVVxgGZFR3JaXmkstnG1IR9Qbt6.jpg`,
      `${TMDB}/ypS7R36Vjcn51zZsXsta5onnaCo.jpg`,
      `${TMDB}/ubDtIBwdS9b29sBofAkqWz3PqkT.jpg`,
      `${TMDB}/xmcOeS0BKCBg5MwM3dfMrSUqyNh.jpg`,
    ],
    className: 'rotate-7 translate-x-[58%] translate-y-[6%] z-20',
    dim: true,
  },
  // Dessus, posée à plat
  {
    title: 'Films préférés',
    count: 31,
    covers: [
      `${TMDB}/qJ2tW6WMUDux911r6m7haRef0WH.jpg`,
      `${TMDB}/pEoqbqtLc4CcwDUDqxmEDSWpWTZ.jpg`,
      `${TMDB}/7uPGS5CgvIjDcFUhw9HB9qYeDXf.jpg`,
      `${TMDB}/pkKBYrihVm5kuBgOH04KagSids0.jpg`,
    ],
    className: 'rotate-0 z-30 shadow-poster-front',
  },
];

function DeckCard({ deck }: { deck: Deck }) {
  return (
    <div
      className={cn(
        'border-border bg-card rounded-card absolute w-[190px] border p-2.5 max-[749px]:w-[160px]',
        deck.className,
        deck.dim && 'brightness-[0.55]',
      )}
    >
      <div className="rounded-poster grid aspect-square grid-cols-2 overflow-hidden">
        {deck.covers.map((src) => (
          <div key={src} className="bg-secondary relative">
            <Image src={src} alt="" fill sizes="95px" className="object-cover" />
          </div>
        ))}
      </div>
      <p className="text-foreground mt-2 truncate text-sm font-semibold">{deck.title}</p>
      <p className="text-muted-foreground mt-0.5 text-xs">{deck.count} titres</p>
    </div>
  );
}

export function ListShowcase() {
  return (
    <div
      aria-hidden
      className="relative flex h-[320px] items-center justify-center max-[749px]:h-[270px]"
    >
      {DECK.map((deck) => (
        <DeckCard key={deck.title} deck={deck} />
      ))}
    </div>
  );
}
