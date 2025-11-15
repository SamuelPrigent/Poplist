import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ListChecks, Users, Sparkles, Check, Star } from "lucide-react";
import { tmdbAPI } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HeroSection3 } from "@/components/Home/HeroSection3";
import { useLanguageStore } from "@/store/language";

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
  const [trending, setTrending] = useState<TrendingItem[]>([]);

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
      <HeroSection3 content={content} trending={trending} />

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
              Planifiez, suivez et profitez de vos films ensemble
            </h2>
            <p className="mb-10 text-lg text-gray-400">
              Organisez vos soirées TV et partagez vos découvertes avec vos amis
            </p>

            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Users className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    Création de listes
                  </h3>
                  <p className="text-sm text-gray-400">
                    Créez votre collection personnelle de films et séries
                    incontournables.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <ListChecks className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    Suivez des watchlists d'autres utilisateurs
                  </h3>
                  <p className="text-sm text-gray-400">
                    Les watchlist de la communauté peuvent vous inspirez,
                    profitez-en.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Sparkles className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    Découvrez des films et séries
                  </h3>
                  <p className="text-sm text-gray-400">
                    Parcourez nos watchlists ainsi que celle de la communauté.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-sky-500/20">
                  <Check className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-white">
                    Suivez vos visionnages
                  </h3>
                  <p className="text-sm text-gray-400">
                    Sur vos watchlist personnelle et suivi indiqué ce que celles
                    que vous avez vu.
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
            Démarrez dans la secondes
          </h2>
          <p className="text-lg text-gray-400">
            Pas de set-up compliqué, c'est vous et vos contenus préférés
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
              Créez votre watchlist
            </h3>
            <p className="text-balance text-[16px] text-gray-300">
              Commencez avec "Mes films favoris" ou soyez nostalgique avec
              "Films d'enfance".
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-500/20 text-xl font-bold text-purple-400">
                2
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-purple-400">
              Ajoutez des films
            </h3>
            <p className="text-balance text-[16px] text-gray-300">
              Recherchez un film ou une série à l'aide d'un mot clé et ajoutez
              le à votre watchlist du moment.
            </p>
          </div>

          <div className="w-full max-w-[277px] rounded-lg text-center">
            <div className="mb-4 flex justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-500/20 text-xl font-bold text-yellow-400">
                3
              </div>
            </div>
            <h3 className="mb-3 text-xl font-semibold text-yellow-400">
              Partagez-la avec vos amis
            </h3>
            <p className="text-balance text-[16px] text-gray-300">
              Mettez vos watchlist en mode "public" et partagez les facilement
              avec un lien.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-slate-900/50 py-20">
        <div className="container mx-auto max-w-[1150px] px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-white">
              Apprécié par les passionnés
            </h2>
            <p className="text-lg text-gray-400">
              Rejoignez une communauté d'utilisateurs satisfaits
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
                "Application parfaite pour organiser mes watchlists. Interface
                claire et intuitive."
              </p>
              <p className="font-semibold text-white">— Marie L.</p>
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
                "Très pratique ! Permet de garder une trace de ce qu'on a vu et
                de ce qu'on souhaite recommander."
              </p>
              <p className="font-semibold text-white">— Thomas D.</p>
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
                "Simple, efficace, exactement ce que je cherchais pour gérer mes
                films à voir."
              </p>
              <p className="font-semibold text-white">— Julie M.</p>
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
            Commence à créer tes watchlists facilement
          </h2>
          <p className="mb-10 text-xl text-gray-400">
            Rejoignez WatchlistHub et organisez vos contenus favoris en quelques
            clics.
          </p>
          <Link to="/account/watchlists">
            <Button
              size="lg"
              className="bg-gray-200 px-8 py-4 text-base font-semibold text-black transition-colors hover:bg-gray-300"
            >
              Créer ma watchlist
            </Button>
          </Link>
          <p className="mt-4 text-sm text-gray-400">
            Application gratuite • Pas de carte requise
          </p>
        </div>
      </section>
    </div>
  );
}
