import type { PrivacyContent } from '../../../types/privacy';
import { privacyFr } from './fr';
import { privacyEn } from './en';
import { privacyDe } from './de';
import { privacyEs } from './es';
import { privacyIt } from './it';
import { privacyPt } from './pt';

export const privacyContent: Record<string, PrivacyContent> = {
  fr: privacyFr,
  en: privacyEn,
  de: privacyDe,
  es: privacyEs,
  it: privacyIt,
  pt: privacyPt,
};
