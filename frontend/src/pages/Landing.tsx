import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Users, Sparkles, Star } from "lucide-react";
import { tmdbAPI } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeroSection } from "@/components/Home/HeroSection";
import { useLanguageStore } from "@/store/language";
import { useAuth } from "@/context/auth-context";

interface TrendingItem {
  id: number;
  title?: string;
  name?: string;
  poster_path?: string;
  backdrop_path?: string;
  media_type: string;
}

export function Landing() {
  const { content } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const [trending, setTrending] = useState<TrendingItem[]>([]);

  // Determine the watchlist URL based on authentication status
  const watchlistsUrl = isAuthenticated
    ? "/account/watchlists"
    : "/local/watchlists";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const trendingData = await tmdbAPI.getTrending("day");
        setTrending(trendingData.results || []);
      } catch (error) {
        console.error("Failed to fetch trending:", error);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <HeroSection
        content={content}
        trending={trending}
        watchlistsUrl={watchlistsUrl}
      />

      {/* Trending Movies Row */}
      <section className="py-9">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-[90%] grid-cols-3 gap-6 md:grid-cols-6">
            {trending.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="aspect-[2/3] overflow-hidden rounded-lg shadow-lg transition-transform hover:scale-105"
              >
                {item.poster_path && (
                  <img
                    src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                    alt={item.title || item.name}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 pb-28 pt-24">
        <div className="mx-auto grid max-w-[88%] items-center gap-16 lg:grid-cols-[55%_45%]">
          {/* Left: Features */}
          <div>
            <h2 className="mb-4 text-4xl font-bold leading-tight text-white">
              {content.landing.hero.tagline}
            </h2>
            <p className="mb-10 text-lg text-gray-400">
              {content.landing.hero.subtitle}
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <ListChecks className="h-5 w-5 text-sky-400" />
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
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
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
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Users className="h-5 w-5 text-sky-400" />
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
          <div className="relative">
            <div className="relative overflow-hidden rounded-lg">
              {/* Screenshot placeholder - remplace par une vraie capture d'écran */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
                <div className="p-8">
                  <div className="mb-6 h-10 w-2/3 rounded-lg bg-slate-700"></div>
                  <div className="grid grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square rounded-lg bg-slate-700"
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Gradient fade overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Start in Seconds */}
      <section className="container mx-auto mb-32 px-4 py-5">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-white">
            {content.landing.startInSeconds.title}
          </h2>
          <p className="text-lg text-gray-400">
            {content.landing.startInSeconds.subtitle}
          </p>
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
            <p className="text-balance text-[16px] text-gray-300">
              {content.landing.startInSeconds.step1.description}
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-400">
                2
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-400">
              {content.landing.startInSeconds.step2.title}
            </h3>
            <p className="text-balance text-[16px] text-gray-300">
              {content.landing.startInSeconds.step2.description}
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-xl font-bold text-yellow-400">
                3
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-yellow-400">
              {content.landing.startInSeconds.step3.title}
            </h3>
            <p className="text-balance text-[16px] text-gray-300">
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
            <p className="text-lg text-gray-400">
              {content.landing.testimonials.subtitle}
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-background p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                "{content.landing.testimonials.testimonial1.text}"
              </p>
              <p className="font-semibold text-white">
                {content.landing.testimonials.testimonial1.author}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                "{content.landing.testimonials.testimonial2.text}"
              </p>
              <p className="font-semibold text-white">
                {content.landing.testimonials.testimonial2.author}
              </p>
            </div>

            <div className="rounded-lg border border-border bg-background p-6">
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-500 text-yellow-500"
                  />
                ))}
              </div>
              <p className="mb-4 text-gray-400">
                "{content.landing.testimonials.testimonial3.text}"
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
              <h2 className="mb-4 text-3xl font-bold text-white">
                {content.home.faq.title}
              </h2>
              <p className="text-muted-foreground">
                {content.home.faq.subtitle}
              </p>
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
      <section className="bg-gradient-to-br from-slate-900/50 via-slate-900/60 to-yellow-900/20 py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-6 text-4xl font-bold text-white">
            {content.landing.finalCta.title}
          </h2>
          <p className="mb-10 text-xl text-gray-400">
            {content.landing.finalCta.subtitle}
          </p>
          <Link to={watchlistsUrl}>
            <Button
              size="lg"
              className="bg-gray-200 px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gray-300"
            >
              {content.landing.finalCta.button}
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            {content.landing.finalCta.disclaimer}
          </p>
        </div>
      </section>
    </div>
  );
}
