import { useState, useRef, useEffect } from "react";
import { useLanguageStore, type Language } from "@/store/language";
import { ChevronDown } from "lucide-react";

const languages: { code: Language; flag: string; name: string }[] = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
];

export function Footer() {
  const { language, content, setLanguage } = useLanguageStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentLanguage = languages.find((lang) => lang.code === language);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  return (
    <footer className="mt-40 border-t border-border bg-background py-6">
      <div className="container mx-auto flex items-center justify-between px-4">
        <div className="text-sm text-muted-foreground">
          {content.footer.appName}
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent"
          >
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span>{currentLanguage?.name}</span>
            <ChevronDown
              className={`h-4 w-4 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-40 overflow-hidden rounded-md border border-border bg-card shadow-lg">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-accent ${
                    lang.code === language
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
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
