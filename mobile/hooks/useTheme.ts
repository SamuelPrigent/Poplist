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

const MIDNIGHT: ThemeColors = {
  background: '#121212',
  panel: '#181818',
  container: '#1e1e1e',
  fab: '#282828',
  secondary: '#282828',
  border: '#333333',
  muted: '#2a2a2a',
  mutedForeground: '#b3b3b3',
  card: '#121212',
  cardHover: '#36363780',
  accent: '#282828',
  input: '#333333',
  ring: '#b3b3b3',
}

export function useTheme(): ThemeColors {
  return MIDNIGHT
}
