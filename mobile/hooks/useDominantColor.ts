import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

const FALLBACK_COLOR = '#1a1a2e';

let getColors: ((url: string, config: any) => Promise<any>) | null = null;

try {
  // react-native-image-colors requires native modules (dev build only)
  const mod = require('react-native-image-colors');
  getColors = mod.getColors;
} catch {
  // Not available in Expo Go — fallback will be used
}

export function useDominantColor(imageUrl: string | null | undefined): string {
  const [color, setColor] = useState(FALLBACK_COLOR);

  useEffect(() => {
    if (!imageUrl || !getColors) {
      setColor(FALLBACK_COLOR);
      return;
    }

    let cancelled = false;

    getColors(imageUrl, {
      fallback: FALLBACK_COLOR,
      cache: true,
      key: imageUrl,
    })
      .then((result: any) => {
        if (cancelled) return;

        if (Platform.OS === 'android') {
          setColor(result.darkVibrant || result.dominant || result.average || FALLBACK_COLOR);
        } else if (Platform.OS === 'ios') {
          setColor(result.background || result.primary || FALLBACK_COLOR);
        } else {
          setColor(result.darkVibrant || result.dominant || FALLBACK_COLOR);
        }
      })
      .catch(() => {
        if (!cancelled) setColor(FALLBACK_COLOR);
      });

    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  return color;
}
