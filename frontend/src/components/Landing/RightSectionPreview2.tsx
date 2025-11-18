export function RightSectionPreview2() {
  // Watchlists fictives avec des thèmes spécifiques
  const mockWatchlists = [
    {
      name: "Sci-Fi Epic",
      posters: [
        "https://image.tmdb.org/t/p/w500/jRXYjXNq0Cs2TcJjLkki24MLp7u.jpg", // Avatar
        "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg", // Interstellar
        "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg", // Inception
        "https://image.tmdb.org/t/p/w500/5BwqwxMEjeFtdknRV792Svo0K1v.jpg", // The Martian
      ],
    },
    {
      name: "Harry Potter",
      posters: [
        "https://image.tmdb.org/t/p/w500/wuMc08IPKEatf9rnMNXvIDxqP4W.jpg", // Sorcerer's Stone
        "https://image.tmdb.org/t/p/w500/sdEOH0992YZ0QSxgXNIGLq1ToUi.jpg", // Chamber of Secrets
        "https://image.tmdb.org/t/p/w500/aWxwnYoe8p2d2fcxOqtvAtJ72Rw.jpg", // Prisoner of Azkaban
        "https://image.tmdb.org/t/p/w500/fECBtHlr0RB3foNHDiCBXeg9Bv9.jpg", // Goblet of Fire
      ],
    },
    {
      name: "Disney Classics",
      posters: [
        "https://image.tmdb.org/t/p/w500/qI9lkmsC8LURNowxsaAoCX1A97l.jpg", // Tarzan
        "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg", // Le Roi Lion
        "https://image.tmdb.org/t/p/w500/fht7xph50bzcvtfsPkcrHRSPYcT.jpg", // Merlin l'Enchanteur
        "https://image.tmdb.org/t/p/w500/fU54mG8yvk7VBA6BI6TDeyrzt5d.jpg", // Abominable
      ],
    },
    {
      name: "Batman Saga",
      posters: [
        "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg", // The Dark Knight
        "https://image.tmdb.org/t/p/w500/vzvKcPQ4o7TjWeGIn0aGC9FeVNu.jpg", // Batman Begins
        "https://image.tmdb.org/t/p/w500/hr0L2aueqlP2BYUblTTjmtn0hw4.jpg", // The Dark Knight Rises
        "https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDteOkCU.jpg", // Batman 1989
      ],
    },
    {
      name: "Marvel Universe",
      posters: [
        "https://image.tmdb.org/t/p/w500/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg", // Avengers
        "https://image.tmdb.org/t/p/w500/78lPtwv72eTNqFW9COBYI0dWDJa.jpg", // Iron Man
        "https://image.tmdb.org/t/p/w500/rweIrveL43TaxUN0akQEaAXL6x0.jpg", // Spider-Man
        "https://image.tmdb.org/t/p/w500/prSfAi1xGrhLQNxVSUFh61xQ4Qy.jpg", // Thor
      ],
    },
    {
      name: "Animation",
      posters: [
        "https://image.tmdb.org/t/p/w500/2H1TmgdfNtsKlU9jKdeNyYL5y8T.jpg", // Inside Out
        "https://image.tmdb.org/t/p/w500/vpbaStTMt8qqXaEgnOR2EE4DNJk.jpg", // Up
        "https://image.tmdb.org/t/p/w500/gGEsBPAijhVUFoiNpgZXqRVWJt2.jpg", // Coco
        "https://image.tmdb.org/t/p/w500/xvx4Yhf0DVH8G4LzNISpMfFBDy2.jpg", // Ratatouille
      ],
    },
  ];

  return (
    <div className="relative">
      <div className="relative overflow-hidden rounded-lg">
        {/* Simulated app interface */}
        <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="p-8">
            {/* Header bar simulation - hauteur réduite */}
            <div className="mb-6 flex items-center gap-3">
              <div className="h-6 w-2/3 rounded-lg bg-gradient-to-r from-slate-700 to-slate-600"></div>
            </div>

            {/* Watchlist cards grid */}
            <div className="grid grid-cols-3 gap-4">
              {mockWatchlists.slice(0, 6).map((watchlist, index) => (
                <div
                  key={index}
                  className="group relative cursor-pointer overflow-hidden rounded-lg bg-slate-800 transition-all hover:scale-105 hover:shadow-xl"
                >
                  {/* 2x2 thumbnail grid */}
                  <div className="grid aspect-square grid-cols-2 grid-rows-2 gap-0.5 bg-slate-900 p-0.5">
                    {watchlist.posters.map((posterUrl, i) => (
                      <div
                        key={i}
                        className="aspect-square overflow-hidden bg-slate-800"
                      >
                        <img
                          src={posterUrl}
                          alt=""
                          className="h-full w-full object-cover transition-opacity group-hover:opacity-80"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Gradient fade overlay */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-background"></div>
      </div>
    </div>
  );
}
