'use client';

import { useLanguageStore } from '@/store/language';
import { privacyContent } from './content';

export default function PrivacyPage() {
  const { language } = useLanguageStore();
  const t = privacyContent[language] || privacyContent.fr;
  const email = 'samue.prigent@yahoo.fr';

  return (
    <div className="container mx-auto max-w-3xl px-4 py-16 pb-20">
      <h1 className="text-foreground mb-8 text-3xl font-bold">{t.title}</h1>
      <p className="text-muted-foreground mb-2 text-sm">{t.effective}</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <p className="text-muted-foreground">{t.intro}</p>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.collectTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.collectIntro}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 pl-2">
            <li>{t.collectEmail}</li>
            <li>{t.collectUsername}</li>
            <li>{t.collectAvatar}</li>
            <li>{t.collectLists}</li>
          </ul>
          <p className="text-muted-foreground mt-3">{t.collectNoTracking}</p>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.useTitle}</h2>
          <p className="text-muted-foreground">{t.useDescription}</p>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.thirdPartyTitle}</h2>
          <p className="text-muted-foreground mb-3">{t.thirdPartyIntro}</p>
          <ul className="text-muted-foreground list-inside list-disc space-y-1 pl-2">
            <li>
              <a
                href="https://expo.io/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-4 hover:opacity-80"
              >
                Expo
              </a>{' '}
              &mdash; {t.thirdPartyExpo.replace('Expo — ', '').replace('Expo — ', '')}
            </li>
            <li>{t.thirdPartyGoogle}</li>
            <li>{t.thirdPartyCloudinary}</li>
            <li>{t.thirdPartyTMDB}</li>
          </ul>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.storageTitle}</h2>
          <p className="text-muted-foreground">{t.storageDescription}</p>
        </section>

        <section id="delete-data">
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.deletionTitle}</h2>
          <p className="text-muted-foreground">
            {t.deletionDescription}{' '}
            <a
              href={`mailto:${email}`}
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              {email}
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.childrenTitle}</h2>
          <p className="text-muted-foreground">{t.childrenDescription}</p>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.changesTitle}</h2>
          <p className="text-muted-foreground">{t.changesDescription}</p>
        </section>

        <section>
          <h2 className="text-foreground mb-3 text-lg font-semibold">{t.contactTitle}</h2>
          <p className="text-muted-foreground">
            {t.contactDescription}{' '}
            <a
              href={`mailto:${email}`}
              className="text-foreground underline underline-offset-4 hover:opacity-80"
            >
              {email}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
