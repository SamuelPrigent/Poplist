import { usePreferencesStore } from '../store/preferences'

export interface ThemeColors {
  background: string
  panel: string
  container: string
  fab: string
  secondary: string
  border: string
  muted: string
  mutedForeground: string
  card: string
  cardHover: string
  accent: string
  input: string
  ring: string
}

const OCEAN: ThemeColors = {
  background: '#020817',
  panel: '#060d1a',
  container: '#0f1729',
  fab: '#1a2540',
  secondary: '#1e293b',
  border: '#1e293b',
  muted: '#1e293b',
  mutedForeground: '#94a3b8',
  card: '#020817',
  cardHover: '#36363780',
  accent: '#1e293b',
  input: '#1e293b',
  ring: '#94a3b8',
}

const MIDNIGHT: ThemeColors = {
  background: '#080808',
  panel: '#0c0c0c',
  container: '#1c1c1e',
  fab: '#2c2c2e',
  secondary: '#27272a',
  border: '#27272a',
  muted: '#27272a',
  mutedForeground: '#a1a1aa',
  card: '#080808',
  cardHover: '#36363780',
  accent: '#27272a',
  input: '#27272a',
  ring: '#a1a1aa',
}

export function useTheme(): ThemeColors {
  const bgTheme = usePreferencesStore((s) => s.bgTheme)
  return bgTheme === 'midnight' ? MIDNIGHT : OCEAN
}
