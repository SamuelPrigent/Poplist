'use client';

import { useQuery } from '@tanstack/react-query';
import { Compass, ListPlus, Share, UserPlus } from 'lucide-react';
import { PageFade } from '@/components/ui/PageFade';
import {
  FinalCtaShowcase,
  HeroSwitcher,
  ListShowcase,
  StepsShowcase,
  TestimonialsShowcase,
} from '@/components/Landing';
import { Section, SectionHeading } from '@/components/Landing/primitives';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { tmdbQueries } from '@/api/queries';
import { useLanguageStore } from '@/store/language';
import type { Content } from '@/types/content';

/* ────────────────────────────── Features ────────────────────────────── */

const FEATURES = [
  { key: 'organize', icon: ListPlus },
  { key: 'collaborate', icon: UserPlus },
  { key: 'share', icon: Share },
  { key: 'discover', icon: Compass },
] as const;

function Features({ content }: { content: Content }) {
  return (
    <Section id="ensavoirplus">
      <div className="grid items-center gap-16 lg:grid-cols-[1fr_minmax(0,440px)] max-[749px]:gap-10">
        <div>
          <SectionHeading>
            <span className="max-[749px]:hidden">{content.landing.features.sectionTitle}</span>
            <span className="hidden max-[749px]:inline">
              {content.landing.features.sectionTitleMobile}
            </span>
          </SectionHeading>

          {/* Uniforme : chaque feature a son titre ET sa description. */}
          <ul className="mt-10 space-y-7 max-[749px]:mt-8 max-[749px]:space-y-6">
            {FEATURES.map(({ key, icon: Icon }) => {
              const feature = content.landing.features[key];
              return (
                <li key={key} className="flex items-start gap-4">
                  <Icon
                    strokeWidth={1.5}
                    className="text-foreground/70 mt-0.5 h-5 w-5 shrink-0"
                    aria-hidden
                  />
                  <div>
                    <h3 className="text-title text-foreground">{feature.title}</h3>
                    <p className="text-body text-copy mt-1 max-w-[62ch]">
                      {feature.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <ListShowcase />
      </div>
    </Section>
  );
}

/* ─────────────────────────────── FAQ ────────────────────────────────── */

const FAQ_KEYS = ['pricing', 'exploreSection', 'whatMakesDifferent', 'streaming'] as const;

function Faq({ content }: { content: Content }) {
  return (
    <Section>
      {/* 40% pour le titre : il tient sur une ligne, les questions prennent
          le reste. */}
      <div className="grid gap-12 min-[750px]:grid-cols-[minmax(0,40%)_1fr] min-[750px]:gap-16">
        <div className="min-[750px]:sticky min-[750px]:top-28">
          <SectionHeading className="whitespace-nowrap max-[899px]:whitespace-normal">
            {content.home.faq.title}
          </SectionHeading>
          <p className="text-body text-copy mt-4 max-w-[46ch] pr-8 max-[749px]:pr-0">
            {content.home.faq.subtitle}
          </p>
        </div>

        <Accordion type="single" collapsible className="border-border border-t">
          {FAQ_KEYS.map((key) => (
            <AccordionItem key={key} value={key}>
              <AccordionTrigger className="text-title text-foreground py-5 text-left">
                {content.home.faq.questions[key].question}
              </AccordionTrigger>
              <AccordionContent className="text-body text-copy max-w-[68ch] pb-5">
                {content.home.faq.questions[key].answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}

/* ─────────────────────────────── Page ───────────────────────────────── */

function LandingPageInner() {
  const { content } = useLanguageStore();

  // Les deux CTA de la landing (hero et bas de page) mènent à /home, pas
  // directement aux listes personnelles : on fait passer le visiteur par
  // l'interface dans son ensemble plutôt que de le parachuter sur un espace
  // vide. Destination fixe, donc plus de dépendance à l'auth ni au montage.
  const ctaUrl = '/home';

  // Préchauffe le cache TMDB partagé avec /home (mêmes queryKey, staleTime 1h)
  // → la nav landing → home ne refetch pas. Le résultat n'est pas affiché ici.
  useQuery(tmdbQueries.trending('day'));

  return (
    <div className="bg-background min-h-screen overflow-hidden max-[749px]:px-[7px]">
      <HeroSwitcher content={content} ctaUrl={ctaUrl} />
      <Features content={content} />
      <StepsShowcase content={content} />
      <TestimonialsShowcase content={content} />
      <Faq content={content} />
      <FinalCtaShowcase content={content} ctaUrl={ctaUrl} />
    </div>
  );
}

export default function LandingContent() {
  return (
    <PageFade>
      <LandingPageInner />
    </PageFade>
  );
}
