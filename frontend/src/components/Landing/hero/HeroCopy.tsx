import { Check, Library, type LucideIcon } from 'lucide-react';
import { Img as Image } from '@/components/ui/Img';
import { CtaGhostButton, CtaPrimary } from '@/components/Landing/primitives';
import { cn } from '@/lib/cn';
import type { Content } from '@/types/content';

/**
 * Colonne texte du hero — 6 variantes, sélectionnables en haut à droite.
 *
 * Deux références conservées telles quelles (Sobre, Plateformes), puis SIX
 * itérations autour de la carte posée sur le mot « listes ». Toutes les
 * cartes partagent le socle « Plateformes » (titre court en blanc plein,
 * sous-titre, boutons, rangée de logos) et ne diffèrent que par le
 * traitement de la carte.
 *
 * Références (dossier « Website i like ») :
 *   Sobre       ← Superhuman : titre, une ligne, un bouton. Rien d'autre.
 *   Plateformes ← Airtable / Nuxt / kargul.studio : logos en pied de bloc.
 *   Les cartes  ← Crème de la crème (objets flottants glissés dans le texte),
 *                 croisé avec le vocabulaire de la salle de projection.
 *
 * Toutes les chaînes viennent du store i18n existant : aucune copie inventée,
 * aucune métrique fabriquée (cf. PRODUCT.md § Evidence on Hand), et les
 * 6 langues fonctionnent sans nouvelle clé.
 *
 * Typo (impeccable/typeset) : 3 rôles seulement — `display` pour le h1,
 * `body` pour la phrase (mesure ≤ 46ch), `label` pour tout le méta. Le
 * contraste entre rôles passe par la taille ET le ton, jamais par la couleur.
 */

export function scrollToFeatures() {
  document.querySelector('#ensavoirplus')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/** Les 2 références conservées telles quelles. */
export const HERO_COPY_REFERENCES = [
  { id: 'sobre', label: 'Sobre' },
  { id: 'plateformes', label: 'Plateformes' },
] as const;

/** Les 6 traitements de la carte posée sur le mot « listes ». */
/**
 * Famille « Encre » : carte quasi noire, un seul point de cyan par variante.
 * Ce qui change d'une à l'autre, c'est OÙ le cyan se pose et QUELLE icône
 * porte le propos. Angles volontairement plus faibles que le -6° initial.
 */
export const HERO_COPY_CARDS = [
  { id: 'halo', label: 'Halo' },
  { id: 'souligne', label: 'Souligné' },
  { id: 'fusion', label: 'Fusion' },
  { id: 'diffus', label: 'Diffus' },
] as const;

/** Teinte unique de tous les pictogrammes (reprise de « Souligné »). */
const ICON_COLOR = 'hsl(210 20% 78%)';

/**
 * Troisième famille : 10 traitements du bloc texte, tous appuyés sur une
 * convention web réelle (soulignement, surligneur, cadre, contraste de
 * graisse, deux tons, point final, italique serif…). Cinq mettent en valeur
 * le mot « listes », cinq restent sobres à la manière de « Plateformes ».
 */
export const HERO_COPY_TEXTS = [
  { id: 'trait', label: 'Trait' },
  { id: 'surligneur', label: 'Surligneur' },
  { id: 'cadre', label: 'Cadre' },
  { id: 'capitales', label: 'Capitales' },
  { id: 'graisse', label: 'Graisse' },
  { id: 'deuxtons', label: 'Deux tons' },
  { id: 'point', label: 'Point' },
  { id: 'serif', label: 'Serif' },
  { id: 'colonne', label: 'Colonne' },
  { id: 'filet', label: 'Filet' },
] as const;

export type HeroCopyVariant =
  | (typeof HERO_COPY_REFERENCES)[number]['id']
  | (typeof HERO_COPY_CARDS)[number]['id']
  | (typeof HERO_COPY_TEXTS)[number]['id'];

const PLATFORM_LOGOS = [
  '/watchProvider/netflix2.svg',
  '/watchProvider/primeVideo.svg',
  '/watchProvider/disneyplus.svg',
  '/watchProvider/appleTv.svg',
  '/watchProvider/hbo.svg',
];

/**
 * Coupe le titre après le premier mot « listes » (list* dans les 6 locales) :
 * avant = premier plan, après = atténué. Sans match, titre rendu tel quel.
 * Réservé aux variantes historiques ; les nouvelles gardent un titre plein.
 *
 * La seconde moitié recule sur DEUX axes à la fois : le ton (papier atténué)
 * et la graisse (400 contre 600). Le titre garde une seule taille, donc une
 * seule ligne de lecture, mais la hiérarchie se voit sans qu'on la cherche.
 * C'est la Weight Rule de DESIGN.md appliquée à la lettre : l'emphase passe
 * par la graisse, jamais par la seule couleur.
 */
function renderTwoTone(title: string) {
  const words = title.split(' ');
  const index = words.findIndex((word) => /^list/i.test(word));
  if (index === -1 || index === words.length - 1) return title;

  return (
    <>
      {words.slice(0, index + 1).join(' ')}{' '}
      <span className="text-muted-foreground font-normal">
        {words.slice(index + 1).join(' ')}
      </span>
    </>
  );
}

/**
 * Enveloppe le mot « listes » (list* dans les 6 locales) dans un objet posé
 * sur la ligne. `wrap` reçoit le mot et rend l'objet ; le reste du titre est
 * inchangé et reste en blanc plein.
 */
function renderWithObject(title: string, wrap: (word: string) => React.ReactNode) {
  const words = title.split(' ');
  const index = words.findIndex((word) => /^list/i.test(word));
  if (index === -1) return title;

  const before = words.slice(0, index).join(' ');
  const after = words.slice(index + 1).join(' ');
  return (
    <>
      {before ? `${before} ` : null}
      {wrap(words[index])}
      {after ? ` ${after}` : null}
    </>
  );
}

/* ───────────────────────────── Fragments ───────────────────────────── */

function Title({
  content,
  centered,
  wide = false,
}: {
  content: Content;
  centered: boolean;
  wide?: boolean;
}) {
  return (
    <h1
      className={cn(
        'font-display text-display text-foreground',
        wide ? 'max-w-[19ch]' : centered ? 'max-w-[17ch]' : 'max-w-[15ch]',
      )}
    >
      <span className="max-[749px]:hidden">{renderTwoTone(content.landing.hero.title)}</span>
      <span className="hidden max-[749px]:inline">
        {renderTwoTone(content.landing.hero.titleMobile)}
      </span>
    </h1>
  );
}

/**
 * Titre court des nouvelles variantes : `titleMobile` sur TOUS les écrans
 * (« Créez des listes de vos contenus favoris »), en blanc plein — plus de
 * seconde moitié en gris. `wrap` permet d'habiller le mot « listes ».
 */
function ShortTitle({
  content,
  centered,
  wrap,
  roomy = false,
}: {
  content: Content;
  centered: boolean;
  wrap?: (word: string) => React.ReactNode;
  /** Desserre l'interligne : sans ça, un objet inséré dans la ligne est
      rogné par l'interligne très serré (1.02) du rôle `display`. */
  roomy?: boolean;
}) {
  const title = content.landing.hero.titleMobile;
  return (
    <h1
      className={cn(
        'font-display text-display text-foreground',
        centered ? 'max-w-[16ch]' : 'max-w-[14ch]',
        // 1.14 : juste assez pour qu'un objet inséré ne soit pas rogné par
        // l'interligne de 1.02 du rôle `display`, sans desserrer le bloc.
        roomy && 'leading-[1.14]',
      )}
    >
      {wrap ? renderWithObject(title, wrap) : title}
    </h1>
  );
}

function Subtitle({ content, className }: { content: Content; className?: string }) {
  return (
    <p className={cn('text-body text-muted-foreground max-w-[46ch]', className)}>
      <span className="max-[749px]:hidden">{content.landing.hero.subtitle}</span>
      <span className="hidden max-[749px]:inline">{content.landing.hero.subtitleMobile}</span>
    </p>
  );
}

function Actions({
  content,
  ctaUrl,
  compact,
  centered,
  className,
}: {
  content: Content;
  ctaUrl: string;
  compact: boolean;
  centered: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', centered && 'justify-center', className)}
    >
      <CtaPrimary to={ctaUrl} withArrow size={compact ? 'sm' : 'md'}>
        {content.home.hero.cta}
      </CtaPrimary>
      <CtaGhostButton onClick={scrollToFeatures} size={compact ? 'sm' : 'md'}>
        {content.home.hero.ctaSecondary}
      </CtaGhostButton>
    </div>
  );
}

/** Réassurance : un check par item (le disclaimer i18n est « A • B »). */
function Reassurance({
  content,
  centered,
  className,
}: {
  content: Content;
  centered: boolean;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'text-label text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1',
        centered && 'justify-center',
        className,
      )}
    >
      {content.landing.finalCta.disclaimer.split('•').map((part) => (
        <span key={part} className="flex items-center gap-1.5">
          <Check strokeWidth={1.5} className="h-4 w-4 shrink-0" aria-hidden />
          {part.trim()}
        </span>
      ))}
    </p>
  );
}

/* ───────────────────────────── Variantes ───────────────────────────── */

type VariantProps = {
  content: Content;
  ctaUrl: string;
  centered: boolean;
  compact: boolean;
};

function CopySobre({ content, ctaUrl, centered, compact }: VariantProps) {
  return (
    <>
      <Title content={content} centered={centered} />
      <Subtitle content={content} className="mt-5" />
      <Actions
        content={content}
        ctaUrl={ctaUrl}
        compact={compact}
        centered={centered}
        className="mt-8"
      />
      <Reassurance content={content} centered={centered} className="mt-6" />
    </>
  );
}

/** Rangée de logos plateformes : le socle des variantes « Plateformes ». */
function PlatformRow({ centered, className }: { centered: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        'border-border flex items-center gap-4 border-t pt-6',
        centered && 'justify-center',
        className,
      )}
    >
      {PLATFORM_LOGOS.map((logo) => (
        <Image
          key={logo}
          src={logo}
          alt=""
          width={22}
          height={22}
          className="h-[22px] w-[22px] object-contain opacity-55"
        />
      ))}
    </div>
  );
}

function CopyPlateformes({ content, ctaUrl, centered, compact }: VariantProps) {
  return (
    <>
      <Title content={content} centered={centered} />
      <Subtitle content={content} className="mt-5" />
      <Actions
        content={content}
        ctaUrl={ctaUrl}
        compact={compact}
        centered={centered}
        className="mt-8"
      />
      <PlatformRow centered={centered} className="mt-9" />
    </>
  );
}

/* ─────────────────── Les 6 cartes : machinerie commune ─────────────────── */

/**
 * Spécification d'une carte posée sur le mot « listes ».
 *
 * Toutes respectent les 4 corrections demandées :
 *  - un parti pris chromatique identifiable (`background`, `color`) ;
 *  - un vrai fond, jamais le `bg-card` par défaut ;
 *  - le mot plus PETIT que le reste du titre (`fontSize` < 1em) ;
 *  - l'interligne du h1 plafonné à 1.14 (cf. `ShortTitle roomy`).
 */
type CardSpec = {
  background: string;
  border: string;
  color: string;
  /** Taille relative du mot, toujours < 1em. */
  fontSize: string;
  rotation: string;
  radius: string;
  shadow: string;
  padding: string;
  /** Bord bas spécifique. Doit être en style inline : une classe Tailwind
      serait écrasée par le raccourci `border` posé juste avant. */
  borderBottom?: string;
  /** Le pictogramme posé avant le mot. */
  icon: LucideIcon;
  /** Couleur de l'icône, si elle doit se détacher du mot. */
  iconColor?: string;
  /** Calque de lumière interne (halo, dégradé) posé au-dessus du fond. */
  overlay?: string;
  /**
   * Bordure en dégradé. Rend un parent de 1px de padding portant le dégradé,
   * et un enfant au fond opaque qui épouse son rayon : le filet devient
   * continu sur les 4 côtés, là où 4 bordures CSS distinctes se coupent aux
   * angles. Remplace `border` / `borderBottom` quand il est présent.
   */
  gradientBorder?: string;
  /** Épaisseur du bord dégradé, si elle n'est pas uniforme (ex. socle bas). */
  gradientBorderWidth?: string;
  /** Classes supplémentaires sur le span de la carte. */
  className?: string;
};

/**
 * `align-baseline` + `leading-[1]` gardent la carte calée sur la ligne de
 * base ; c'est le h1 qui porte l'interligne, la carte ne le pousse pas.
 *
 * L'icône (lucide) est posée DANS la carte, avant le mot : c'est
 * elle qui image le propos, pas un effet de matière.
 */
function renderCard(spec: CardSpec, word: string) {
  const content = (
    <>
      {/* Calque de lumière interne (halo, dégradé), au-dessus du fond et
          sous le texte. */}
      {spec.overlay ? (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: spec.overlay, borderRadius: 'inherit' }}
        />
      ) : null}
      <spec.icon
        aria-hidden
        strokeWidth={1.75}
        className="relative h-[0.72em] w-[0.72em] shrink-0"
        style={{ color: spec.iconColor ?? ICON_COLOR }}
      />
      <span className="relative">{word}</span>
    </>
  );

  // scale 0.97 : la carte ne vient pas frôler la ligne du dessous.
  // bottom 2px : elle est relevée d'un cheveu pour respirer.
  const placement = {
    fontSize: spec.fontSize,
    transform: `rotate(${spec.rotation}) scale(0.97)`,
    bottom: '2px',
    borderRadius: spec.radius,
    boxShadow: spec.shadow === 'aucune' ? undefined : spec.shadow,
  } as const;

  if (spec.gradientBorder) {
    return (
      <span
        className={cn('relative inline-block align-baseline leading-[1]', spec.className)}
        style={{
          ...placement,
          background: spec.gradientBorder,
          padding: spec.gradientBorderWidth ?? '1px',
        }}
      >
        <span
          className="relative inline-flex items-center gap-[0.22em] whitespace-nowrap"
          style={{
            background: spec.background,
            color: spec.color,
            // Le rayon intérieur = extérieur moins l'épaisseur du filet,
            // sinon l'enfant déborde des angles arrondis du parent.
            borderRadius: `calc(${spec.radius} - 1px)`,
            padding: spec.padding,
          }}
        >
          {content}
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-[0.22em] align-baseline leading-[1] whitespace-nowrap',
        spec.className,
      )}
      style={{
        ...placement,
        background: spec.background,
        border: spec.border,
        color: spec.color,
        padding: spec.padding,
        // N'inclure la longhand QUE si la variante en veut une : React écrit
        // `style.borderBottom = ''` pour une valeur `undefined`, ce qui
        // réinitialise le bord bas posé juste avant par la shorthand
        // `border` — les cartes se retrouvaient sans filet en bas.
        ...(spec.borderBottom ? { borderBottom: spec.borderBottom } : null),
      }}
    >
      {content}
    </span>
  );
}

function makeCardVariant(spec: CardSpec) {
  return function CardVariant({ content, ctaUrl, centered, compact }: VariantProps) {
    return (
      <>
        <ShortTitle
          content={content}
          centered={centered}
          roomy
          wrap={(word) => renderCard(spec, word)}
        />
        <Subtitle content={content} className="mt-6" />
        <Actions
          content={content}
          ctaUrl={ctaUrl}
          compact={compact}
          centered={centered}
          className="mt-8"
        />
        <PlatformRow centered={centered} className="mt-9" />
      </>
    );
  };
}

/* ─────────────────────── Les 6 specs de carte ─────────────────────── */

/**
 * L'angle de -6° est repris de la variante « Guichet », le seul point validé
 * de la passe précédente. Ce qui change : plus aucun effet papier, et c'est
 * l'icône qui image le propos. Les six traitements explorent des
 * matières TECH (relief, grain, ardoise, acier, encre, nuit).
 *
 * Aucun mot des 6 locales (listes / lists / Listen / listas / liste) n'a de
 * jambage descendant : le bord bas peut donc passer sous la ligne de base
 * sans jamais couper une lettre.
 *
 * Note système : DESIGN.md proscrit les dégradés décoratifs. Ceux d'ici sont
 * des dégradés de MATIÈRE sur un objet de 60px (lumière du haut, ombre du
 * bas) — demandés explicitement pour créer du relief. À arbitrer en même
 * temps que le choix de la variante.
 */
const CARD_SPECS: Record<(typeof HERO_COPY_CARDS)[number]['id'], CardSpec> = {
  // Bord dégradé continu + lueur qui monte du bas. Aucun trait franc.
  halo: {
    icon: Library,
    background: 'hsl(222 22% 7%)',
    border: 'none',
    gradientBorder:
      'linear-gradient(170deg, hsl(216 16% 30%) 0%, hsl(206 24% 36%) 42%, rgb(56 199 255 / 0.8) 100%)',
    color: 'hsl(210 25% 97%)',
    fontSize: '0.89em',
    rotation: '-4deg',
    radius: '0.12em',
    shadow: '0 0.16em 0.36em -0.22em rgb(0 0 0 / 0.9)',
    padding: '0.13em 0.24em 0.13em 0.2em',
    // Le halo s'arrête avant le bord : poussé jusqu'au filet, il le noyait.
    overlay:
      'radial-gradient(120% 78% at 50% 100%, rgb(56 199 255 / 0.34) 0%, rgb(56 199 255 / 0.08) 48%, transparent 74%)',
  },
  // Bord fin + trait cyan franc en bas. Le mot est posé sur son socle.
  souligne: {
    icon: Library,
    background: 'hsl(222 22% 7%)',
    border: '1px solid hsl(216 18% 22%)',
    color: 'hsl(210 25% 96%)',
    fontSize: '0.88em',
    rotation: '-2deg',
    radius: '0.11em 0.11em 0.03em 0.03em',
    shadow: 'aucune',
    padding: '0.14em 0.24em 0.08em 0.2em',
    borderBottom: '0.1em solid #38c7ff',
  },
  // Fusion : le bord dégradé de Halo ET le trait franc de Souligné, sans la
  // lueur interne. Le cadre monte en cyan et se conclut sur le socle.
  fusion: {
    icon: Library,
    background: 'hsl(222 22% 7%)',
    border: 'none',
    gradientBorder:
      'linear-gradient(170deg, hsl(216 16% 28%) 0%, hsl(206 26% 38%) 40%, #38c7ff 100%)',
    color: 'hsl(210 25% 97%)',
    fontSize: '0.89em',
    rotation: '-3deg',
    radius: '0.12em 0.12em 0.04em 0.04em',
    shadow: '0 0.16em 0.36em -0.22em rgb(0 0 0 / 0.9)',
    // Le padding bas est porté par l'enfant : c'est le parent qui fait le
    // socle, en épaississant son seul côté bas.
    padding: '0.13em 0.24em 0.13em 0.2em',
    gradientBorderWidth: '1px 1px 0.1em 1px',
  },
  // Diffus : le trait franc éclaire la carte au lieu d'un halo indépendant.
  // La lueur part exactement du socle et se dissipe vers le haut.
  diffus: {
    icon: Library,
    background: 'hsl(222 22% 7%)',
    border: '1px solid hsl(214 18% 26%)',
    color: 'hsl(210 25% 97%)',
    fontSize: '0.88em',
    rotation: '-2.5deg',
    radius: '0.11em 0.11em 0.03em 0.03em',
    shadow: 'aucune',
    padding: '0.14em 0.24em 0.09em 0.2em',
    borderBottom: '0.1em solid #38c7ff',
    overlay:
      'linear-gradient(0deg, rgb(56 199 255 / 0.3) 0%, rgb(56 199 255 / 0.1) 38%, transparent 78%)',
  },
};

const CARD_VARIANTS = Object.fromEntries(
  HERO_COPY_CARDS.map((card) => [card.id, makeCardVariant(CARD_SPECS[card.id])]),
) as Record<(typeof HERO_COPY_CARDS)[number]['id'], (props: VariantProps) => React.ReactElement>;

/* ──────────────────── Les 10 traitements de texte ───────────────────── */

/**
 * Chaque entrée décrit un bloc texte complet :
 *  - `wrap`     : traitement du mot « listes » (5 des 10 en ont un) ;
 *  - `twoTone`  : seconde moitié du titre en gris, la stratégie « Plateformes » ;
 *  - `before`   : élément posé au-dessus du titre (filet) ;
 *  - `after`    : ce qui clôt le bloc — logos plateformes ou réassurance ;
 *  - `roomy`    : desserre l'interligne quand un objet est inséré dans la ligne.
 *
 * Aucune n'invente de concept : ce sont des conventions de titre courantes
 * (soulignement, surligneur, encadré, capitales, contraste de graisse, deux
 * tons, point final, italique serif, colonne étroite, filet de section).
 */
type TextSpec = {
  wrap?: (word: string) => React.ReactNode;
  twoTone?: boolean;
  titleClassName?: string;
  before?: React.ReactNode;
  after: 'logos' | 'reassurance';
  roomy?: boolean;
  subtitle?: boolean;
};

const TEXT_SPECS: Record<(typeof HERO_COPY_TEXTS)[number]['id'], TextSpec> = {
  // Soulignement épais posé sous la ligne de base (Stripe, Linear).
  trait: {
    wrap: (word) => (
      <span className="relative inline-block">
        {word}
        <span
          aria-hidden
          className="absolute -bottom-[0.08em] left-0 h-[0.07em] w-full rounded-full bg-[#38c7ff]"
        />
      </span>
    ),
    after: 'logos',
  },
  // Surligneur : un aplat translucide derrière le mot, légèrement débordant.
  surligneur: {
    wrap: (word) => (
      <span className="relative inline-block">
        <span
          aria-hidden
          className="absolute -inset-x-[0.08em] top-[0.14em] bottom-[0.08em] -z-10 rounded-[0.04em] bg-[rgb(56_199_255/0.24)]"
        />
        {word}
      </span>
    ),
    after: 'reassurance',
  },
  // Encadré filaire, sans fond : le mot est cerné, pas rempli.
  cadre: {
    wrap: (word) => (
      <span className="inline-block rounded-[0.1em] border border-[rgb(56_199_255/0.55)] px-[0.16em] py-[0.04em] align-baseline leading-[1]">
        {word}
      </span>
    ),
    roomy: true,
    after: 'logos',
  },
  // Capitales espacées : le mot change de casse, pas de couleur.
  capitales: {
    wrap: (word) => <span className="text-[0.78em] tracking-[0.06em] uppercase">{word}</span>,
    after: 'logos',
  },
  // Contraste de graisse pur : titre en 400, le mot seul en 700.
  graisse: {
    titleClassName: 'font-normal',
    wrap: (word) => <span className="font-bold">{word}</span>,
    after: 'reassurance',
  },
  // La stratégie « Plateformes » nue : seconde moitié en gris, rien d'autre.
  deuxtons: {
    twoTone: true,
    after: 'reassurance',
  },
  // Point final coloré (Vercel, Linear) : une seule ponctuation accentuée.
  point: {
    twoTone: true,
    after: 'logos',
  },
  // Contraste de FAMILLE : le mot en Instrument Serif italique, le compagnon
  // dessiné d'Instrument Sans, chargé en italique 400 pour ce seul usage.
  serif: {
    wrap: (word) => <span className="font-accent pr-[0.04em] text-[1.1em] italic">{word}</span>,
    roomy: true,
    after: 'logos',
  },
  // Mesure très courte : le titre devient une colonne, la composition parle.
  colonne: {
    titleClassName: 'max-w-[11ch]',
    after: 'reassurance',
  },
  // Filet de section au-dessus du titre : convention éditoriale.
  filet: {
    before: <span aria-hidden className="bg-border mb-7 block h-px w-16" />,
    twoTone: true,
    after: 'logos',
  },
};

function makeTextVariant(id: (typeof HERO_COPY_TEXTS)[number]['id'], spec: TextSpec) {
  return function TextVariant({ content, ctaUrl, centered, compact }: VariantProps) {
    const title = content.landing.hero.titleMobile;
    return (
      <>
        {spec.before}
        <h1
          className={cn(
            'font-display text-display text-foreground',
            centered ? 'max-w-[16ch]' : 'max-w-[14ch]',
            spec.roomy && 'leading-[1.14]',
            spec.titleClassName,
          )}
        >
          {spec.wrap
            ? renderWithObject(title, spec.wrap)
            : spec.twoTone
              ? renderTwoTone(title)
              : title}
          {/* Le point final n'existe que sur la variante qui le porte. */}
          {id === 'point' ? <span className="text-[#38c7ff]">.</span> : null}
        </h1>

        <Subtitle content={content} className="mt-5" />
        <Actions
          content={content}
          ctaUrl={ctaUrl}
          compact={compact}
          centered={centered}
          className="mt-8"
        />
        {spec.after === 'logos' ? (
          <PlatformRow centered={centered} className="mt-9" />
        ) : (
          <Reassurance content={content} centered={centered} className="mt-6" />
        )}
      </>
    );
  };
}

const TEXT_VARIANTS = Object.fromEntries(
  HERO_COPY_TEXTS.map((text) => [text.id, makeTextVariant(text.id, TEXT_SPECS[text.id])]),
) as Record<(typeof HERO_COPY_TEXTS)[number]['id'], (props: VariantProps) => React.ReactElement>;

const VARIANTS: Record<HeroCopyVariant, (props: VariantProps) => React.ReactElement> = {
  sobre: CopySobre,
  plateformes: CopyPlateformes,
  ...CARD_VARIANTS,
  ...TEXT_VARIANTS,
};

/* ─────────────────────────────── Racine ────────────────────────────── */

export function HeroCopy({
  content,
  ctaUrl,
  variant = 'sobre',
  align = 'start',
  compact = false,
  className,
}: {
  content: Content;
  ctaUrl: string;
  variant?: HeroCopyVariant;
  align?: 'start' | 'center';
  compact?: boolean;
  className?: string;
}) {
  const centered = align === 'center';
  const Variant = VARIANTS[variant] ?? CopySobre;

  return (
    <div
      className={cn(
        'flex flex-col',
        centered ? 'items-center text-center' : 'items-start text-left',
        className,
      )}
    >
      <Variant content={content} ctaUrl={ctaUrl} centered={centered} compact={compact} />
    </div>
  );
}
