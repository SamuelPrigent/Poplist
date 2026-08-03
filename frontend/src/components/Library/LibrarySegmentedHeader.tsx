'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';

/**
 * ⚠️ Non utilisé — gardé en réserve.
 *
 * Alternative au bandeau de la page « Bibliothèque » : les deux bascules
 * indépendantes deviennent un choix unique `Tout / Mes listes / Suivies`.
 *
 * Son intérêt n'est pas esthétique, il est fonctionnel : avec les bascules
 * actuelles on peut éteindre les deux et se retrouver devant une grille vide
 * sans que rien ne l'explique. Un choix unique rend cet état impossible.
 *
 * Le mode est dérivé des deux bascules existantes et reposé dessus, donc le
 * store n'a pas besoin de changer pour l'essayer : il suffit d'importer ce
 * composant à la place du bandeau inline dans `account/lists/ListsContent`.
 */
export interface LibrarySegmentedHeaderProps {
  title: string;
  createLabel: string;
  onCreate: (e: React.MouseEvent<HTMLButtonElement>) => void;
  allLabel: string;
  ownedLabel: string;
  savedLabel: string;
  showOwned: boolean;
  showSaved: boolean;
  toggleOwned: () => void;
  toggleSaved: () => void;
}

export function LibrarySegmentedHeader(p: LibrarySegmentedHeaderProps) {
  const mode = p.showOwned && p.showSaved ? 'all' : p.showOwned ? 'owned' : 'saved';
  const setMode = (next: 'all' | 'owned' | 'saved') => {
    const wantOwned = next === 'all' || next === 'owned';
    const wantSaved = next === 'all' || next === 'saved';
    if (wantOwned !== p.showOwned) p.toggleOwned();
    if (wantSaved !== p.showSaved) p.toggleSaved();
  };

  const options = [
    { id: 'all' as const, label: p.allLabel },
    { id: 'owned' as const, label: p.ownedLabel },
    { id: 'saved' as const, label: p.savedLabel },
  ];

  return (
    <>
      <div className="mt-0 mb-4 max-[749px]:mb-5">
        <h1 className="text-headline text-foreground">{p.title}</h1>
      </div>

      <div className="mb-8 flex items-center justify-between max-[749px]:mb-6">
        <div
          role="group"
          aria-label={p.title}
          className="border-border rounded-control flex items-center gap-1 border p-1 max-[749px]:hidden"
        >
          {options.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setMode(o.id)}
              aria-pressed={mode === o.id}
              className={cn(
                'text-label focus-visible:ring-offset-background h-8 cursor-pointer rounded-md px-3 transition-colors focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:outline-none',
                mode === o.id
                  ? 'bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>

        <Button
          className="corner-squircle cursor-pointer rounded-2xl max-[749px]:w-full max-[749px]:justify-center"
          onClick={p.onCreate}
        >
          <Plus className="h-4 w-4" />
          {p.createLabel}
        </Button>
      </div>
    </>
  );
}
