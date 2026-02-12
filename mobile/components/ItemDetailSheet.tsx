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
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getTMDBImageUrl, getTMDBRegion } from '../lib/utils';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg'
import { watchlistAPI } from '../lib/api-client';
import { useLanguageStore } from '../store/language';
import { usePreferencesStore } from '../store/preferences';
import type { WatchlistItem, FullMediaDetails, Platform } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALLOWED_PROVIDERS: Record<string, string> = {
  'Netflix': 'Netflix',
  'Amazon Prime Video': 'Prime Video',
  'Prime Video': 'Prime Video',
  'Apple TV Plus': 'Apple TV',
  'Apple TV+': 'Apple TV',
  'Crunchyroll': 'Crunchyroll',
  'YouTube': 'YouTube',
  'YouTube Premium': 'YouTube',
  'Max': 'HBO Max',
  'HBO Max': 'HBO Max',
  'Max Amazon Channel': 'HBO Max',
  'Disney Plus': 'Disney+',
  'Disney+': 'Disney+',
};

function filterProviders(platforms: Platform[]): Platform[] {
  const matched = new Map<string, Platform>();
  for (const p of platforms) {
    const displayName = ALLOWED_PROVIDERS[p.name];
    if (displayName && !matched.has(displayName)) {
      matched.set(displayName, { name: displayName, logoPath: p.logoPath });
    }
  }
  return Array.from(matched.values());
}
const IMAGE_WIDTH = Math.round(SCREEN_WIDTH * 0.9);
const IMAGE_HEIGHT = Math.round(IMAGE_WIDTH * 9 / 16);


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
  const pulse = useRef(new Animated.Value(0.15)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.15, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.mutedForeground, opacity: pulse }]}
    />
  );
}

/** Pulsing skeleton lines for text content + platform logos */
function SkeletonLines() {
  const pulse = useRef(new Animated.Value(0.12)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.12, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View>
      {/* Meta skeleton */}
      <Animated.View style={{ width: '40%', height: 14, borderRadius: 4, backgroundColor: colors.mutedForeground, opacity: pulse, marginBottom: spacing.md }} />
      {/* Overview line 1 */}
      <Animated.View style={{ width: '100%', height: 14, borderRadius: 4, backgroundColor: colors.mutedForeground, opacity: pulse, marginBottom: spacing.sm }} />
      {/* Overview line 2 */}
      <Animated.View style={{ width: '90%', height: 14, borderRadius: 4, backgroundColor: colors.mutedForeground, opacity: pulse, marginBottom: spacing.sm }} />
      {/* Overview line 3 */}
      <Animated.View style={{ width: '80%', height: 14, borderRadius: 4, backgroundColor: colors.mutedForeground, opacity: pulse, marginBottom: spacing.lg }} />
      {/* Section label skeleton */}
      <Animated.View style={{ width: '30%', height: 14, borderRadius: 4, backgroundColor: colors.mutedForeground, opacity: pulse, marginBottom: spacing.sm }} />
      {/* Platform logos skeleton */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: 56, alignItems: 'center' }}>
            <Animated.View style={{ width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.mutedForeground, opacity: pulse }} />
            <Animated.View style={{ width: 36, height: 8, borderRadius: 3, backgroundColor: colors.mutedForeground, opacity: pulse, marginTop: spacing.xs }} />
          </View>
        ))}
      </View>
    </View>
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

  const panResponder = useMemo(() => PanResponder.create({
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
  }), [hasNavigation]);

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
        fr: 'fr-FR', en: 'en-US', es: 'es-ES',
        de: 'de-DE', it: 'it-IT', pt: 'pt-BR',
      };
      const detailsPromise = watchlistAPI.getItemDetails(
        item.tmdbId.toString(),
        item.mediaType,
        langMap[language] || 'fr-FR',
      );
      const providersPromise = item.platformList.length === 0
        ? watchlistAPI.fetchTMDBProviders(
            item.tmdbId.toString(),
            item.mediaType,
            getTMDBRegion(language),
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
      const seasonWord = details.numberOfSeasons > 1
        ? content.watchlists.seriesInfo.seasons
        : content.watchlists.seriesInfo.season;
      durationText = `${details.numberOfSeasons} ${seasonWord}`;
    }
  } else {
    if (isMovie && item.runtime) {
      durationText = formatRuntime(item.runtime);
    } else if (!isMovie && item.numberOfSeasons) {
      const seasonWord = item.numberOfSeasons > 1
        ? content.watchlists.seriesInfo.seasons
        : content.watchlists.seriesInfo.season;
      durationText = `${item.numberOfSeasons} ${seasonWord}`;
    }
  }

  const backdropUrl = details?.backdropUrl ?? null;
  const rating = details?.rating;
  const overview = details?.overview;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={styles.contentPanel}
          {...panResponder.panHandlers}
        >
          <Pressable onPress={() => {}}>
            {/* Drag handle */}
            <View style={styles.handleRow}>
              <View style={styles.handle} />
            </View>

            <Animated.View style={{ opacity: fadeAnim }}>
            {/* Image with skeleton + gradient overlay */}
            <View style={styles.imageSection}>
              <View style={styles.imageContainer}>
                {/* Skeleton pulse — visible while image loads */}
                {!imageLoaded && <SkeletonPulse />}

                {backdropUrl ? (
                  <Image
                    source={{ uri: backdropUrl }}
                    style={styles.backdropImage}
                    contentFit="cover"
                    transition={350}
                    onLoad={() => setImageLoaded(true)}
                  />
                ) : (
                  <View style={[styles.backdropImage, { backgroundColor: colors.muted }]} />
                )}

                {/* Smooth gradient overlay */}
                <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%">
                  <Defs>
                    <SvgGradient id="backdrop-grad" x1="0" y1="0" x2="0" y2="0.5">
                      <Stop offset="0" stopColor="#000" stopOpacity="0.7" />
                      <Stop offset="1" stopColor="#000" stopOpacity="0" />
                    </SvgGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill="url(#backdrop-grad)" />
                </Svg>

                {/* Add-to-list button */}
                <Pressable
                  style={[
                    styles.addToListBtn,
                    handedness === 'left'
                      ? { left: spacing.sm, right: undefined }
                      : { right: spacing.sm, left: undefined },
                  ]}
                  onPress={() => {/* Phase 1: non-functional */}}
                >
                  <Plus size={18} color={colors.foreground} strokeWidth={2.5} />
                </Pressable>

                {/* Title + rating at bottom */}
                <View style={styles.titleArea}>
                  <Text style={styles.titleText} numberOfLines={2}>
                    {details?.title || item.title}
                  </Text>
                  {rating != null && rating > 0 && (
                    <View style={styles.ratingRow}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Info section */}
            <View style={styles.infoSection}>
              <ScrollView
                contentContainerStyle={styles.infoContent}
                showsVerticalScrollIndicator={false}
              >
                {isLoadingDetails ? (
                  <SkeletonLines />
                ) : (
                  <>
                    {/* Type + Duration */}
                    <Text style={styles.meta}>
                      {typeLabel}
                      {durationText ? ` \u00B7 ${durationText}` : ''}
                    </Text>

                    {/* Synopsis */}
                    {overview ? (
                      <Text style={styles.overview} numberOfLines={3}>
                        {overview}
                      </Text>
                    ) : null}

                    {/* Watch providers */}
                    <Text style={styles.sectionLabel}>
                      {content.watchlists.itemDetails.availableOn}
                    </Text>
                    {filterProviders(providers.length > 0 ? providers : item.platformList).length > 0 ? (
                      <View style={styles.platformRow}>
                        {filterProviders(providers.length > 0 ? providers : item.platformList).map((platform) => {
                          const logoUrl = getTMDBImageUrl(platform.logoPath, 'w92');
                          return logoUrl ? (
                            <View key={platform.name} style={styles.platformItem}>
                              <Image
                                source={{ uri: logoUrl }}
                                style={styles.platformLogo}
                                contentFit="cover"
                              />
                              <Text style={styles.platformName} numberOfLines={1}>
                                {platform.name}
                              </Text>
                            </View>
                          ) : (
                            <View key={platform.name} style={styles.platformFallback}>
                              <Text style={styles.platformFallbackText}>
                                {platform.name}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ) : (
                      <Text style={styles.unavailable}>
                        {content.watchlists.itemDetails.notAvailable}
                      </Text>
                    )}
                  </>
                )}
              </ScrollView>
            </View>
            </Animated.View>

            {/* Navigation bar (only when navigating a list) */}
            {hasNavigation && (
              <View style={styles.navBar}>
                <Pressable
                  style={styles.navBtn}
                  onPress={() => idx > 0 && navigateWithFade(idx - 1)}
                  disabled={idx === 0}
                >
                  <ChevronLeft
                    size={24}
                    color={idx === 0 ? colors.border : colors.foreground}
                  />
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
    backgroundColor: '#0a1122',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    maxHeight: '85%',
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
  // Image
  imageSection: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  imageContainer: {
    width: IMAGE_WIDTH,
    height: IMAGE_HEIGHT,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#0f1729',
  },
  backdropImage: {
    width: '100%',
    height: '100%',
  },
  // Add-to-list button
  addToListBtn: {
    position: 'absolute',
    bottom: spacing.sm,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Title area at bottom of image
  titleArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
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
  // Info section
  infoSection: {
    paddingHorizontal: spacing.lg,
    height: 220,
  },
  infoContent: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  meta: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  overview: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  platformItem: {
    alignItems: 'center',
    width: 56,
  },
  platformLogo: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
  },
  platformName: {
    fontSize: 10,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  platformFallback: {
    backgroundColor: colors.muted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
  },
  platformFallbackText: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
  unavailable: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  // Navigation bar
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
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
