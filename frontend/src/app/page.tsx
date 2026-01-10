'use client';

import { Check, Sparkles, Star, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { HeroSection } from '@/components/Landing/HeroSection';
import { RightSectionPreview } from '@/components/Landing/RightSectionPreview';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/context/auth-context';
import { tmdbAPI } from '@/lib/api-client';
import { useLanguageStore } from '@/store/language';

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type: string;
}

const STAR_KEYS = ['star-1', 'star-2', 'star-3', 'star-4', 'star-5'];

export default function LandingPage() {
  const { content } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState<TrendingItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Determine the lists URL based on authentication status
  // Utilise /local/lists par défaut côté SSR pour éviter hydration mismatch
  const watchlistsUrl = mounted && isAuthenticated ? '/account/lists' : '/local/lists';

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendingData = await tmdbAPI.getTrending('day');
        setTrending(trendingData.results || []);
      } catch (error) {
        console.error('Failed to fetch trending:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {/* Hero Section */}
      <HeroSection content={content} trending={trending} watchlistsUrl={watchlistsUrl} />

      {/* Trending Movies Row */}
      <section className="py-9">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-[90%] grid-cols-3 gap-6 md:grid-cols-6">
            {trending.slice(0, 6).map(item => (
              <div
                key={item.id}
                className="relative aspect-2/3 overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105"
              >
                {item.poster_path && (
                  <Image
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title || item.name || ''}
                    fill
                    sizes="(max-width: 768px) 33vw, 16vw"
                    className="object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pt-24 pb-28">
        <div className="mx-auto grid max-w-[88%] items-center gap-16 lg:grid-cols-[55%_45%]">
          {/* Left: Features */}
          <div>
            <h2 className="mb-4 text-3xl leading-tight font-bold text-white">
              {content.landing.hero.tagline}
            </h2>
            <p className="mb-10 text-lg text-gray-400">{content.landing.hero.subtitle}</p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Users className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {content.landing.features.organize.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.organize.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {content.landing.features.discover.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.discover.description}
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Check className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    {content.landing.features.share.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {content.landing.features.share.description}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: App Screenshot with gradient fade */}
          <RightSectionPreview />
        </div>
      </section>

      {/* Start in Seconds */}
      <section className="container mx-auto mb-32 px-4 py-5">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            {content.landing.startInSeconds.title}
          </h2>
          <p className="text-lg text-gray-400">{content.landing.startInSeconds.subtitle}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-8">
          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20 text-xl font-bold text-sky-400">
                1
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-sky-400">
              {content.landing.startInSeconds.step1.title}
            </h3>
            <p className="text-[16px] text-balance text-gray-300">
              {content.landing.startInSeconds.step1.description}
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-xl font-bold text-yellow-400">
                2
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-yellow-400">
              {content.landing.startInSeconds.step2.title}
            </h3>
            <p className="text-[16px] text-balance text-gray-300">
              {content.landing.startInSeconds.step2.description}
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-400">
                3
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-400">
              {content.landing.startInSeconds.step3.title}
            </h3>
            <p className="text-[16px] text-balance text-gray-300">
              {content.landing.startInSeconds.step3.description}
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-900/50 py-20">
        <div className="container mx-auto max-w-[1150px] px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              {content.landing.testimonials.title}
            </h2>
            <p className="text-lg text-gray-400">{content.landing.testimonials.subtitle}</p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="border-border bg-background rounded-lg border p-6">
              <div className="mb-4 flex gap-1">
                {STAR_KEYS.map(starKey => (
                  <Star
                    key={`testimonial1-${starKey}`}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                &quot;{content.landing.testimonials.testimonial1.text}&quot;
              </p>
              <p className="font-semibold text-white">
                {content.landing.testimonials.testimonial1.author}
              </p>
            </div>

            <div className="border-border bg-background rounded-lg border p-6">
              <div className="mb-4 flex gap-1">
                {STAR_KEYS.map(starKey => (
                  <Star
                    key={`testimonial2-${starKey}`}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                &quot;{content.landing.testimonials.testimonial2.text}&quot;
              </p>
              <p className="font-semibold text-white">
                {content.landing.testimonials.testimonial2.author}
              </p>
            </div>

            <div className="border-border bg-background rounded-lg border p-6">
              <div className="mb-4 flex gap-1">
                {STAR_KEYS.map(starKey => (
                  <Star
                    key={`testimonial3-${starKey}`}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                &quot;{content.landing.testimonials.testimonial3.text}&quot;
              </p>
              <p className="font-semibold text-white">
                {content.landing.testimonials.testimonial3.author}
              </p>
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
      <section className="bg-linear-to-br from-slate-900/50 via-slate-900/60 to-yellow-900/20 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">{content.landing.finalCta.title}</h2>
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
