import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

interface LibraryEmptyProps {
  title: string;
  description: string;
  /** Variantes courtes affichées sur mobile (< 750px). Absentes → texte normal. */
  titleMobile?: string;
  descriptionMobile?: string;
}

/**
 * Placeholder « bibliothèque vide » — version brute : pas de fond ni de bordure,
 * pas d'icône, uniquement titre + description (raccourcis sur mobile).
 * Partagé par /account/lists et /local/lists.
 */
export function LibraryEmpty({
  title,
  description,
  titleMobile,
  descriptionMobile,
}: LibraryEmptyProps) {
  return (
    <Empty className="border-0 bg-transparent">
      <EmptyHeader>
        <EmptyTitle>
          <span className={titleMobile ? 'max-[749px]:hidden' : undefined}>{title}</span>
          {titleMobile && <span className="hidden max-[749px]:inline">{titleMobile}</span>}
        </EmptyTitle>
        <EmptyDescription>
          <span className={descriptionMobile ? 'max-[749px]:hidden' : undefined}>
            {description}
          </span>
          {descriptionMobile && (
            <span className="hidden max-[749px]:inline">{descriptionMobile}</span>
          )}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
