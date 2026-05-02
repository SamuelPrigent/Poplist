'use client';

import { ChevronRight, Compass, Film, ListPlus, Share2, Star, UserPlus } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HeroSection, RightSectionPreviewV2 } from '@/components/Landing';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { domAnimation, LazyMotion, m } from 'motion/react';
import { useAuth } from '@/context/auth-context';
import { tmdb as tmdbApi } from '@/api';
import { useIsMounted } from '@/hooks/useIsMounted';
import { useLanguageStore } from '@/store/language';

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type?: 'movie' | 'tv';
}

const STAR_KEYS = ['star-1', 'star-2', 'star-3', 'star-4', 'star-5'];

// avatar

function LandingPageInner() {
  const { content } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const mounted = useIsMounted();

  // Determine the lists URL based on authentication status
  // Utilise /local/lists par défaut côté SSR pour éviter hydration mismatch
  const watchlistsUrl = mounted && isAuthenticated ? '/account/lists' : '/local/lists';

  // Fetch trending in background - doesn't block page reveal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendingData = await tmdbApi.getTrending('day');
        setTrending(trendingData.results || []);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-background min-h-screen overflow-hidden">
      <HeroSection content={content} trending={trending} watchlistsUrl={watchlistsUrl} />

      {/* Features Section */}
      <section id="ensavoirplus" className="container mx-auto px-4 pt-[130px] pb-28">
        <div className="mx-auto grid max-w-[88%] items-center gap-16 lg:grid-cols-[55%_45%]">
          {/* Left: Features */}
          <div>
            <h2 className="mb-4 text-3xl leading-tight font-bold text-white">
              {content.landing.features.sectionTitle}
            </h2>
            <p className="mb-10 text-lg text-gray-400">
              {content.landing.features.sectionSubtitle}
            </p>

            <div className="space-y-5">
              {/* Feature 1: Création de listes */}
              <div className="flex gap-4">
                <div className="shrink-0 rounded-full bg-linear-to-r from-blue-500/50 to-blue-500/10 p-px">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <ListPlus strokeWidth={1.6} className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">
                    {content.landing.features.organize.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.organize.description}
                  </p>
                </div>
              </div>

              {/* Feature 2: Collaborateurs */}
              <div className="flex gap-4">
                <div className="shrink-0 rounded-full bg-linear-to-r from-blue-500/50 to-blue-500/10 p-px">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <UserPlus strokeWidth={1.6} className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">
                    {content.landing.features.collaborate.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.collaborate.description}
                  </p>
                </div>
              </div>

              {/* Feature 3: Partage */}
              <div className="flex gap-4">
                <div className="shrink-0 rounded-full bg-linear-to-r from-blue-500/50 to-blue-500/10 p-px">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <Share2 strokeWidth={1.6} className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">
                    {content.landing.features.share.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.share.description}
                  </p>
                </div>
              </div>

              {/* Feature 4: Suivre */}
              <div className="flex gap-4">
                <div className="shrink-0 rounded-full bg-linear-to-r from-blue-500/50 to-blue-500/10 p-px">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                    <Compass strokeWidth={1.6} className="h-5 w-5 text-blue-400" />
                  </div>
                </div>
                <div>
                  <h3 className="mb-1 text-base font-semibold text-white">
                    {content.landing.features.discover.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.discover.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: App Screenshot with gradient fade */}
          {/* <RightSectionPreview /> */}
          <RightSectionPreviewV2 />
        </div>
      </section>

      {/* Start in Seconds */}
      <section className="container mx-auto mb-28 px-4 py-5 pt-10">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            {content.landing.startInSeconds.title}
          </h2>
          <p className="text-lg text-gray-400">{content.landing.startInSeconds.subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 lg:gap-6">
          {/* Step 1 - Card with icon */}
          <div className="w-full max-w-[280px] rounded-2xl bg-linear-to-br from-blue-500/20 to-transparent p-px">
            <div className="relative flex h-full flex-col items-center overflow-hidden rounded-2xl bg-background bg-[linear-gradient(135deg,rgb(30_64_175/0.1),transparent_60%)] px-6 py-8 text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute top-[2px] left-[18px] font-black leading-none text-blue-400/[0.14] select-none text-[110px] mask-[linear-gradient(to_bottom,black_0%,transparent_88%)]"
              >
                1
              </span>
              <span className="relative mb-4 text-xs font-medium text-blue-400/80 uppercase tracking-wider">
                Étape 1
              </span>
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                <ListPlus strokeWidth={1.4} className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="relative mb-2 text-lg font-semibold text-white">
                {content.landing.startInSeconds.step1.title}
              </h3>
              <p className="relative text-sm text-gray-400">
                {content.landing.startInSeconds.step1.description}
              </p>
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="hidden lg:flex items-center">
            <ChevronRight className="h-[18px] w-[18px] text-white/90" strokeWidth={1.6} />
          </div>

          {/* Step 2 - Card with animated spark border */}
          <div className="relative w-full max-w-[280px] rounded-2xl bg-linear-to-br from-blue-500/20 to-transparent p-px motion-safe:bg-[conic-gradient(from_var(--border-angle),transparent_0deg,transparent_155deg,rgba(96,165,250,0.3)_170deg,#60a5fa_180deg,#ffffff_183deg,#ffffff_187deg,#60a5fa_190deg,transparent_205deg,transparent_360deg),linear-gradient(to_bottom_right,rgb(59_130_246/0.2),transparent)] motion-safe:animate-border-spin">
            <div className="relative flex h-full flex-col items-center overflow-hidden rounded-2xl bg-background bg-[linear-gradient(135deg,rgb(30_64_175/0.1),transparent_60%)] px-6 py-8 text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute top-[2px] left-[18px] font-black leading-none text-blue-400/[0.14] select-none text-[110px] mask-[linear-gradient(to_bottom,black_0%,transparent_88%)]"
              >
                2
              </span>
              <span className="relative mb-4 text-xs font-medium text-blue-400/80 uppercase tracking-wider">
                Étape 2
              </span>
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                <Film strokeWidth={1.4} className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="relative mb-2 text-lg font-semibold text-white">
                {content.landing.startInSeconds.step2.title}
              </h3>
              <p className="relative text-sm text-gray-400">
                {content.landing.startInSeconds.step2.description}
              </p>
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="hidden lg:flex items-center">
            <ChevronRight className="h-[18px] w-[18px] text-white/90" strokeWidth={1.6} />
          </div>

          {/* Step 3 - Card with icon */}
          <div className="w-full max-w-[280px] rounded-2xl bg-linear-to-br from-blue-500/20 to-transparent p-px">
            <div className="relative flex h-full flex-col items-center overflow-hidden rounded-2xl bg-background bg-[linear-gradient(135deg,rgb(30_64_175/0.1),transparent_60%)] px-6 py-8 text-center">
              <span
                aria-hidden
                className="pointer-events-none absolute top-[2px] left-[18px] font-black leading-none text-blue-400/[0.14] select-none text-[110px] mask-[linear-gradient(to_bottom,black_0%,transparent_88%)]"
              >
                3
              </span>
              <span className="relative mb-4 text-xs font-medium text-blue-400/80 uppercase tracking-wider">
                Étape 3
              </span>
              <div className="relative mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-500/10">
                <Share2 strokeWidth={1.4} className="h-7 w-7 text-blue-400" />
              </div>
              <h3 className="relative mb-2 text-lg font-semibold text-white">
                {content.landing.startInSeconds.step3.title}
              </h3>
              <p className="relative text-sm text-gray-400">
                {content.landing.startInSeconds.step3.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative py-10 pb-30">
        {/* Blur glow shapes */}
        <div className="pointer-events-none absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full blur-[120px] bg-slate-700/5" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full blur-[120px] bg-slate-700/5" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[300px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px] bg-slate-800/5" />

        <div className="relative z-10 container mx-auto max-w-[1150px] px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              {content.landing.testimonials.title}
            </h2>
            <p className="text-lg text-gray-400">{content.landing.testimonials.subtitle}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Testimonial 1 */}
            <div className="group rounded-xl bg-linear-to-br from-blue-500/20 to-transparent p-px transition-all duration-300">
              <div className="flex h-full flex-col justify-between rounded-xl bg-background bg-[linear-gradient(to_bottom,rgb(30_64_175/0.07)_0%,rgb(30_64_175/0.07)_50%,rgb(30_64_175/0.02)_100%)] p-6">
                <div>
                  <div className="mb-4 flex gap-1">
                    {STAR_KEYS.map(starKey => (
                      <Star
                        key={`testimonial1-${starKey}`}
                        className="h-4 w-4 fill-yellow-500/70 stroke-yellow-500"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    &quot;{content.landing.testimonials.testimonial1.text}&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="rounded-full bg-linear-to-br from-gray-400/40 to-gray-600/20 p-px aspect-square overflow-hidden">
                    <Image
                      src="/landing/avatar/marie.webp"
                      alt={content.landing.testimonials.testimonial1.author}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {content.landing.testimonials.testimonial1.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {content.landing.testimonials.testimonial1.pseudo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="group rounded-xl bg-linear-to-br from-blue-500/20 to-transparent p-px transition-all duration-300">
              <div className="flex h-full flex-col justify-between rounded-xl bg-background bg-[linear-gradient(to_bottom,rgb(30_64_175/0.07)_0%,rgb(30_64_175/0.07)_50%,rgb(30_64_175/0.02)_100%)] p-6">
                <div>
                  <div className="mb-4 flex gap-1">
                    {STAR_KEYS.map(starKey => (
                      <Star
                        key={`testimonial2-${starKey}`}
                        className="h-4 w-4 fill-yellow-500/70 stroke-yellow-500"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    &quot;{content.landing.testimonials.testimonial2.text}&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="rounded-full bg-linear-to-br from-gray-400/40 to-gray-600/20 p-px overflow-hidden">
                    <Image
                      src="/landing/avatar/thomas.webp"
                      alt={content.landing.testimonials.testimonial2.author}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {content.landing.testimonials.testimonial2.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {content.landing.testimonials.testimonial2.pseudo}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="group rounded-xl bg-linear-to-br from-blue-500/20 to-transparent p-px transition-all duration-300">
              <div className="flex h-full flex-col justify-between rounded-xl bg-background bg-[linear-gradient(to_bottom,rgb(30_64_175/0.07)_0%,rgb(30_64_175/0.07)_50%,rgb(30_64_175/0.02)_100%)] p-6">
                <div>
                  <div className="mb-4 flex gap-1">
                    {STAR_KEYS.map(starKey => (
                      <Star
                        key={`testimonial3-${starKey}`}
                        className="h-4 w-4 fill-yellow-500/70 stroke-yellow-500"
                        strokeWidth={1.5}
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    &quot;{content.landing.testimonials.testimonial3.text}&quot;
                  </p>
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="rounded-full bg-linear-to-br from-gray-400/40 to-gray-600/20 p-px aspect-square overflow-hidden">
                    <Image
                      src="/landing/avatar/julie.webp"
                      alt={content.landing.testimonials.testimonial3.author}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-white text-sm">
                      {content.landing.testimonials.testimonial3.author}
                    </p>
                    <p className="text-xs text-gray-500">
                      {content.landing.testimonials.testimonial3.pseudo}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 pb-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-12 text-center">
              <h2 className="mb-4 text-3xl font-bold text-white">{content.home.faq.title}</h2>
              <p className="text-muted-foreground">{content.home.faq.subtitle}</p>
            </div>

            <Accordion type="single" collapsible className="mx-auto w-[90%]">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left text-white">
                  {content.home.faq.questions.privateWatchlists.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {content.home.faq.questions.privateWatchlists.answer}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left text-white">
                  {content.home.faq.questions.pricing.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {content.home.faq.questions.pricing.answer}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left text-white">
                  {content.home.faq.questions.exploreSection.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {content.home.faq.questions.exploreSection.answer}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left text-white">
                  {content.home.faq.questions.whatMakesDifferent.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {content.home.faq.questions.whatMakesDifferent.answer}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left text-white">
                  {content.home.faq.questions.streaming.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {content.home.faq.questions.streaming.answer}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative py-24 pb-32">
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            {content.landing.finalCta.title.split(' ').slice(0, -1).join(' ')}{' '}
            <span className="relative inline-block">
              {content.landing.finalCta.title.split(' ').slice(-1)}
              <span className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-[linear-gradient(48deg,lab(22_22.17_-40.1/0.41),#38c7ff_60%)]" />
            </span>
          </h2>
          <p className="mb-10 text-xl text-gray-400">{content.landing.finalCta.subtitle}</p>
          <Link
            href={watchlistsUrl}
            className="corner-squircle inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gray-200 px-7 py-5 text-base font-semibold whitespace-nowrap text-black transition-colors hover:bg-gray-300"
          >
            {content.landing.finalCta.button}
          </Link>
          <p className="mt-4 text-sm text-gray-400">{content.landing.finalCta.disclaimer}</p>
        </div>
      </section>
    </div>
  );
}

export default function LandingContent() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <LandingPageInner />
      </m.div>
    </LazyMotion>
  );
}
