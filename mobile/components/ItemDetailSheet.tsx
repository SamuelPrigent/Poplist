import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { Star, ChevronLeft, ChevronRight, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getTMDBImageUrl, getTMDBRegion } from '../lib/utils';
import { LinearGradient } from 'expo-linear-gradient';
import { watchlistAPI } from '../lib/api-client';
import { useLanguageStore } from '../store/language';
import { usePreferencesStore } from '../store/preferences';
import { useTheme } from '../hooks/useTheme';
import ProviderIcon, { type ProviderKey } from './ProviderIcon';
import type { WatchlistItem, FullMediaDetails, Platform } from '../types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const PROVIDER_MAP: Record<string, ProviderKey> = {
  Netflix: 'netflix',
  'Amazon Prime Video': 'primevideo',
  'Prime Video': 'primevideo',
  YouTube: 'youtube',
  'YouTube Premium': 'youtube',
  'Disney Plus': 'disneyplus',
  'Disney+': 'disneyplus',
  Crunchyroll: 'crunchyroll',
  Max: 'hbomax',
  'HBO Max': 'hbomax',
  'Max Amazon Channel': 'hbomax',
};

function getMatchedProviders(platforms: Platform[]): ProviderKey[] {
  const seen = new Set<ProviderKey>();
  const result: ProviderKey[] = [];
  for (const p of platforms) {
    const key = PROVIDER_MAP[p.name];
    if (key && !seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result.slice(0, 3);
}

const IMAGE_WIDTH = Math.round(SCREEN_WIDTH * 0.93);
const IMAGE_HEIGHT = Math.round((IMAGE_WIDTH * 3) / 4);

interface ItemDetailSheetProps {
  item: WatchlistItem | null;
  visible: boolean;
  onClose: () => void;
  items?: WatchlistItem[];
  currentIndex?: number;
  onNavigate?: (index: number) => void;
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/** Pulsing skeleton placeholder for the image */
function SkeletonPulse() {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.15, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: theme.mutedForeground, opacity: pulse }]}
    />
  );
}

/** Skeleton matching the exact real content structure */
function SkeletonContent() {
  const theme = useTheme();
  const pulse = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.12, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const block = (width: number | string, height: number, extra?: object) => (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: 4,
          backgroundColor: theme.mutedForeground,
          opacity: pulse,
        },
        extra,
      ]}
    />
  );

  return (
    <>
      {/* Hero section — same structure as real content */}
      <View style={styles.heroSection}>
        <View style={[styles.imageContainer, { backgroundColor: theme.container }]}>
          <View style={styles.overlaidContent}>
            {/* Top info: title + rating + meta */}
            <View>
              {block('70%', 22, { marginBottom: spacing.sm })}
              <View style={[styles.ratingRow, { marginBottom: spacing.xs }]}>{block(50, 16)}</View>
              {block('45%', 16)}
            </View>
            {/* Bottom info: overview lines */}
            <View>
              {block('100%', 14, { marginBottom: spacing.sm })}
              {block('90%', 14, { marginBottom: spacing.sm })}
              {block('75%', 14)}
            </View>
          </View>
        </View>
      </View>

      {/* Details section — same structure */}
      <View style={styles.detailsSection}>
        {/* Platform section: left (label + icons) / right (button) */}
        <View style={styles.platformSection}>
          <View style={styles.platformLeft}>
            {block('35%', 14, { marginBottom: spacing.xs })}
            <View style={styles.platformRow}>
              {[0, 1, 2].map(i => (
                <View key={i}>{block(37, 37, { borderRadius: borderRadius.md })}</View>
              ))}
            </View>
          </View>
          {block(90, 28, { borderRadius: borderRadius.full, marginLeft: spacing.md })}
        </View>
        {/* Cast label */}
        {block('40%', 14, { marginBottom: spacing.sm + 3 })}
        {/* Cast items */}
        <View style={styles.castRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.castItem}>
              {block(38, 38, { borderRadius: borderRadius.md })}
              {block(50, 10, { marginTop: spacing.xs })}
              {block(40, 9, { marginTop: 2 })}
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

export default function ItemDetailSheet({
  item,
  visible,
  onClose,
  items,
  currentIndex,
  onNavigate,
}: ItemDetailSheetProps) {
  const { content, language } = useLanguageStore();
  const { handedness } = usePreferencesStore();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [details, setDetails] = useState<FullMediaDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [providers, setProviders] = useState<Platform[]>([]);
  const [imageLoaded, setImageLoaded] = useState(false);
  const isNavigatingRef = useRef(false);

  // Crossfade animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const hasNavigation = !!(items && items.length > 1 && onNavigate);
  const idx = currentIndex ?? 0;

  // Refs for PanResponder (avoid stale closures)
  const idxRef = useRef(idx);
  const itemsRef = useRef(items);
  const onNavigateRef = useRef(onNavigate);
  const onCloseRef = useRef(onClose);
  idxRef.current = idx;
  itemsRef.current = items;
  onNavigateRef.current = onNavigate;
  onCloseRef.current = onClose;

  const navigateWithFade = (newIndex: number) => {
    if (!onNavigateRef.current) return;
    isNavigatingRef.current = true;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 120,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onNavigateRef.current?.(newIndex);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gs) => {
          if (gs.dy > 25 && Math.abs(gs.dx) < 20) return true;
          if (hasNavigation && Math.abs(gs.dx) > 30 && Math.abs(gs.dy) < 15) return true;
          return false;
        },
        onPanResponderRelease: (_evt, gs) => {
          if (gs.dy > 80 && Math.abs(gs.dx) < 40) {
            onCloseRef.current();
            return;
          }
          const curIdx = idxRef.current;
          const curItems = itemsRef.current;
          if (!curItems || !onNavigateRef.current) return;
          if (gs.dx < -50 && curIdx < curItems.length - 1) {
            navigateWithFade(curIdx + 1);
          } else if (gs.dx > 50 && curIdx > 0) {
            navigateWithFade(curIdx - 1);
          }
        },
      }),
    [hasNavigation]
  );

  useEffect(() => {
    setImageLoaded(false);
  }, [item?.tmdbId]);

  useEffect(() => {
    if (item && visible) {
      if (isNavigatingRef.current) {
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
        isNavigatingRef.current = false;
      }
      loadDetails();
    } else {
      setDetails(null);
      setProviders([]);
      setImageLoaded(false);
      fadeAnim.setValue(1);
    }
  }, [item, visible]);

  const loadDetails = async () => {
    if (!item) return;
    setIsLoadingDetails(true);
    setDetails(null);
    try {
      const langMap: Record<string, string> = {
        fr: 'fr-FR',
        en: 'en-US',
        es: 'es-ES',
        de: 'de-DE',
        it: 'it-IT',
        pt: 'pt-BR',
      };
      const detailsPromise = watchlistAPI.getItemDetails(
        item.tmdbId.toString(),
        item.mediaType,
        langMap[language] || 'fr-FR'
      );
      const providersPromise =
        item.platformList.length === 0
          ? watchlistAPI.fetchTMDBProviders(
              item.tmdbId.toString(),
              item.mediaType,
              getTMDBRegion(language)
            )
          : Promise.resolve([]);
      const [detailsRes, providersRes] = await Promise.all([detailsPromise, providersPromise]);
      setDetails(detailsRes.details);
      if (providersRes.length > 0) setProviders(providersRes);
    } catch (error) {
      console.error('Failed to load item details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  if (!item) return null;

  const isMovie = item.mediaType === 'movie';
  const typeLabel = isMovie
    ? content.watchlists.contentTypes.movie
    : content.watchlists.contentTypes.series;

  let durationText = '';
  if (details) {
    if (isMovie && details.runtime) {
      durationText = formatRuntime(details.runtime);
    } else if (!isMovie && details.numberOfSeasons) {
      const seasonWord =
        details.numberOfSeasons > 1
          ? content.watchlists.seriesInfo.seasons
          : content.watchlists.seriesInfo.season;
      durationText = `${details.numberOfSeasons} ${seasonWord}`;
    }
  } else {
    if (isMovie && item.runtime) {
      durationText = formatRuntime(item.runtime);
    } else if (!isMovie && item.numberOfSeasons) {
      const seasonWord =
        item.numberOfSeasons > 1
          ? content.watchlists.seriesInfo.seasons
          : content.watchlists.seriesInfo.season;
      durationText = `${item.numberOfSeasons} ${seasonWord}`;
    }
  }

  const backdropUrl = details?.backdropUrl ?? null;
  const rating = details?.rating;
  const overview = details?.overview;
  const releaseYear = details?.releaseDate ? new Date(details.releaseDate).getFullYear() : null;

  const metaParts = [typeLabel, durationText, releaseYear].filter(Boolean);
  const metaText = metaParts.join(' \u00B7 ');

  const matchedProviders = getMatchedProviders(
    providers.length > 0 ? providers : item.platformList
  );
  const cast = details?.cast?.slice(0, 3) ?? [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[styles.contentPanel, { backgroundColor: theme.panel }]}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={() => {}} style={{ flex: 1 }}>
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <Animated.View style={{ opacity: fadeAnim, flex: 1 }}>
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingDetails ? (
                  <SkeletonContent />
                ) : (
                  <>
                    {/* Hero section: image + overlaid content */}
                    <View style={styles.heroSection}>
                      <View style={[styles.imageContainer, { backgroundColor: theme.container }]}>
                        {/* Backdrop image — fills entire container */}
                        {!imageLoaded && <SkeletonPulse />}
                        {backdropUrl ? (
                          <Image
                            source={{ uri: backdropUrl }}
                            style={StyleSheet.absoluteFill}
                            contentFit="cover"
                            transition={350}
                            onLoad={() => setImageLoaded(true)}
                          />
                        ) : (
                          <View
                            style={[StyleSheet.absoluteFill, { backgroundColor: theme.muted }]}
                          />
                        )}

                        {/* Very dark cinematic overlay */}
                        <LinearGradient
                          colors={[
                            'rgba(0,0,0,0.88)',
                            'rgba(0,0,0,0.6)',
                            'rgba(0,0,0,0.65)',
                            'rgba(0,0,0,0.88)',
                          ]}
                          locations={[0, 0.3, 0.6, 1]}
                          style={StyleSheet.absoluteFill}
                        />

                        {/* Content overlaid on darkened image */}
                        <View style={styles.overlaidContent}>
                          {/* Top: title + rating + metadata */}
                          <View>
                            <Text style={styles.titleText} numberOfLines={2}>
                              {details?.title || item.title}
                            </Text>
                            {rating != null && rating > 0 && (
                              <View style={styles.ratingRow}>
                                <Star size={14} color="#fbbf24" fill="#fbbf24" />
                                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                              </View>
                            )}
                            <Text style={styles.metaText}>{metaText}</Text>
                          </View>

                          {/* Bottom: overview (3 lines max) */}
                          {overview ? (
                            <Text style={styles.overview} numberOfLines={3}>
                              {overview}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    </View>

                    {/* Details section below hero */}
                    <View style={styles.detailsSection}>
                      {/* Platform section: left (label + icons) / right (Ajouter) */}
                      <View style={styles.platformSection}>
                        <View style={styles.platformLeft}>
                          <Text style={[styles.sectionLabel, { marginBottom: spacing.xs }]}>
                            {content.watchlists.itemDetails.availableOn}
                          </Text>
                          {matchedProviders.length > 0 ? (
                            <View style={styles.platformRow}>
                              {matchedProviders.map(key => (
                                <ProviderIcon key={key} provider={key} />
                              ))}
                            </View>
                          ) : (
                            <Text style={styles.unavailable}>
                              {content.watchlists.itemDetails.notAvailable}
                            </Text>
                          )}
                        </View>
                        <Pressable
                          style={styles.addToListBtn}
                          onPress={() => {
                            /* Phase 1: non-functional */
                          }}
                        >
                          <Plus size={14} color={colors.foreground} strokeWidth={2.5} />
                          <Text style={styles.addToListText}>
                            {content.watchlists.itemDetails.add}
                          </Text>
                        </Pressable>
                      </View>

                      {/* Cast — 3 actors on one line */}
                      {cast.length > 0 && (
                        <>
                          <Text style={[styles.sectionLabel, { marginBottom: spacing.sm + 3 }]}>
                            {content.watchlists.itemDetails.mainCast}
                          </Text>
                          <View style={styles.castRow}>
                            {cast.map(actor => {
                              const photoUrl = getTMDBImageUrl(actor.profileUrl, 'w185');
                              return (
                                <View
                                  key={`${actor.name}-${actor.character}`}
                                  style={styles.castItem}
                                >
                                  {photoUrl ? (
                                    <Image
                                      source={{ uri: photoUrl }}
                                      style={styles.castPhoto}
                                      contentFit="cover"
                                    />
                                  ) : (
                                    <View
                                      style={[styles.castPhoto, { backgroundColor: theme.muted }]}
                                    />
                                  )}
                                  <Text style={styles.castName} numberOfLines={1}>
                                    {actor.name}
                                  </Text>
                                  <Text style={styles.castCharacter} numberOfLines={1}>
                                    {actor.character}
                                  </Text>
                                </View>
                              );
                            })}
                            {cast.length === 2 && <View style={styles.castItem} />}
                          </View>
                        </>
                      )}
                    </View>
                  </>
                )}
              </ScrollView>
            </Animated.View>

            {/* Bottom spacer when there is no navigation */}
            {!hasNavigation && (
              <View style={{ height: Math.max(spacing.lg, insets.bottom + spacing.md) }} />
            )}

            {/* Navigation bar (only when navigating a list) */}
            {hasNavigation && (
              <View
                style={[
                  styles.navBar,
                  { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) },
                ]}
              >
                <Pressable
                  style={styles.navBtn}
                  onPress={() => idx > 0 && navigateWithFade(idx - 1)}
                  disabled={idx === 0}
                >
                  <ChevronLeft size={24} color={idx === 0 ? colors.border : colors.foreground} />
                </Pressable>
                <Text style={styles.navCounter}>
                  {idx + 1} / {items!.length}
                </Text>
                <Pressable
                  style={styles.navBtn}
                  onPress={() => idx < items!.length - 1 && navigateWithFade(idx + 1)}
                  disabled={idx === items!.length - 1}
                >
                  <ChevronRight
                    size={24}
                    color={idx === items!.length - 1 ? colors.border : colors.foreground}
                  />
                </Pressable>
              </View>
            )}
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  contentPanel: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    height: Math.round(SCREEN_HEIGHT * 0.76),
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scrollContent: {
    paddingBottom: spacing.md,
  },
  // Hero section — image with overlaid content
  heroSection: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  overlaidContent: {
    position: 'relative',
    zIndex: 2,
    height: IMAGE_HEIGHT,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  ratingText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#fbbf24',
  },
  metaText: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.7)',
    marginTop: spacing.sm,
  },
  // Overview
  overview: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  // Platform section: left column (label + logos) / right column (button)
  platformSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  platformLeft: {
    flex: 1,
  },
  // Add-to-list pill button
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    marginLeft: spacing.md,
  },
  addToListText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  // Details section below hero
  detailsSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  // Provider icons row
  platformRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  unavailable: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  // Cast — 3 actors in a row, square photos
  castRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  castItem: {
    flex: 1,
    alignItems: 'center',
  },
  castPhoto: {
    width: 38,
    height: 38,
    borderRadius: borderRadius.md,
  },
  castName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.foreground,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  castCharacter: {
    fontSize: 10,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 2,
  },
  // Navigation bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xl,
  },
  navBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navCounter: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: '500',
    minWidth: 60,
    textAlign: 'center',
  },
});
