'use client';

import { ChevronDown, Coffee } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { authAPI } from '@/lib/api-client';
import { type Language, useLanguageStore } from '@/store/language';
import 'flag-icons/css/flag-icons.min.css';

const languages: { code: Language; flagCode: string; name: string }[] = [
  { code: 'fr', flagCode: 'fr', name: 'Français' },
  { code: 'en', flagCode: 'gb', name: 'English' },
  { code: 'de', flagCode: 'de', name: 'Deutsch' },
  { code: 'es', flagCode: 'es', name: 'Español' },
  { code: 'it', flagCode: 'it', name: 'Italiano' },
  { code: 'pt', flagCode: 'pt', name: 'Português' },
];

export function Footer() {
  const { language, content, setLanguage } = useLanguageStore();
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find(lang => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);

    // Save to database if user is authenticated
    if (isAuthenticated) {
      try {
        await authAPI.updateLanguage(lang);
      } catch (error) {
        console.error('Failed to update language in database:', error);
        // Continue with local change even if DB update fails
      }
    }
  };

  return (
    <footer className="border-border bg-background border-t py-6">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="text-muted-foreground text-sm">{content.footer.appName}</div>
          <a
            href="https://buymeacoffee.com/samuelprigl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buy me a coffee"
            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-sm transition-colors"
          >
            <Coffee className="h-4 w-4" />
            <span className="hidden sm:inline">Buy me a coffee</span>
          </a>
        </div>

        <div className="relative z-100" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={`Langue: ${currentLanguage?.name}`}
            className="border-border bg-card text-foreground hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors"
          >
            <span className={`fi fi-${currentLanguage?.flagCode} h-[15px] text-lg opacity-95`} aria-hidden="true" />
            <span>{currentLanguage?.name}</span>
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>

          {isOpen && (
            <div
              role="listbox"
              aria-label="Sélectionner une langue"
              className="border-border bg-card absolute right-0 bottom-full mb-2 w-40 overflow-hidden rounded-md border shadow-lg"
            >
              {languages.map(lang => (
                <button
                  type="button"
                  key={lang.code}
                  role="option"
                  aria-selected={lang.code === language}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`hover:bg-accent flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-sm transition-colors ${
                    lang.code === language ? 'bg-accent text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  <span className={`fi fi-${lang.flagCode} h-[15px] opacity-95`} aria-hidden="true" />
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
