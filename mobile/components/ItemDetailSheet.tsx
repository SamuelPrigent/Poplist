import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, Text, Pressable, StyleSheet, Animated, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Star, Plus, ChevronLeft, CheckCircle2, CirclePlus, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { getTMDBImageUrl, getTMDBRegion } from '../lib/utils';
import { watchlistAPI } from '../lib/api-client';
import { useLanguageStore } from '../store/language';
import { useTheme } from '../hooks/useTheme';
import { mutate } from 'swr';
import Toast from 'react-native-toast-message';
import ProviderIcon, { type ProviderKey } from './ProviderIcon';
import PosterGrid from './PosterGrid';
import { useMyWatchlists } from '../hooks/swr';
import { BottomSheetModal, BottomSheetScrollView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import type { WatchlistItem, FullMediaDetails, Platform } from '../types';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';

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

const POSTER_WIDTH = 120;
const POSTER_HEIGHT = 180; // 2:3 aspect ratio

export interface ItemDetailSheetRef {
  present: () => void;
  dismiss: () => void;
}

interface ItemDetailSheetProps {
  item: WatchlistItem | null;
  visible: boolean;
  onClose: () => void;
  /** When true, opens directly in add-to-list mode */
  initialShowAddToList?: boolean;
  /** @deprecated Navigation removed — kept for backward compatibility */
  items?: WatchlistItem[];
  /** @deprecated Navigation removed — kept for backward compatibility */
  currentIndex?: number;
  /** @deprecated Navigation removed — kept for backward compatibility */
  onNavigate?: (index: number) => void;
}

function formatRuntime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, '0')}`;
}

/** Shared skeleton pulse hook */
function useSkeletonPulse() {
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

  return { pulse, block, theme };
}

/** Skeleton for the text info column (next to the poster) */
function SkeletonTextBlock() {
  const { block } = useSkeletonPulse();

  return (
    <>
      {/* Title */}
      {block('75%', 18, { marginBottom: spacing.xs })}
      {/* Rating */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm }}>
        {block(14, 14, { borderRadius: 7 })}
        {block(28, 14)}
      </View>
      {/* Meta (Film · 1h41 · 2003) */}
      {block('55%', 13, { marginBottom: spacing.sm })}
      {/* Genre badges */}
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {block(70, 22, { borderRadius: 4 })}
        {block(55, 22, { borderRadius: 4 })}
        {block(60, 22, { borderRadius: 4 })}
      </View>
    </>
  );
}

/** Skeleton for description + details sections below the poster row */
function SkeletonDetailsBlock() {
  const { block } = useSkeletonPulse();

  return (
    <>
      {/* Description skeleton */}
      <View style={styles.descriptionSection}>
        {block('100%', 13, { marginBottom: 6 })}
        {block('95%', 13, { marginBottom: 6 })}
        {block('80%', 13, { marginBottom: 6 })}
        {block('40%', 13)}
      </View>

      {/* Details section skeleton */}
      <View style={styles.detailsSection}>
        {/* "Disponible sur" label + icons */}
        {block(110, 14, { marginBottom: spacing.sm })}
        <View style={styles.platformRow}>
          {[0, 1].map(i => (
            <View key={i}>{block(37, 37, { borderRadius: borderRadius.md })}</View>
          ))}
        </View>

        {/* "Acteurs principaux" label */}
        {block(130, 14, { marginTop: spacing.lg, marginBottom: spacing.sm })}
        {/* Cast items */}
        <View style={styles.castRow}>
          {[0, 1, 2].map(i => (
            <View key={i} style={styles.castItem}>
              {block(52, 52, { borderRadius: 26 })}
              {block(60, 10, { marginTop: spacing.xs })}
              {block(45, 9, { marginTop: 2 })}
            </View>
          ))}
        </View>
      </View>
    </>
  );
}

/** Individual list row with pulse animation on toggle */
function ListPickerRow({
  list,
  isAdded,
  onToggle,
}: {
  list: { id: string; name: string; items: any[]; imageUrl?: string };
  isAdded: boolean;
  onToggle: (listId: string) => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const prevAdded = useRef(isAdded);

  useEffect(() => {
    if (prevAdded.current !== isAdded) {
      prevAdded.current = isAdded;
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.35, duration: 80, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  }, [isAdded]);

  return (
    <View style={styles.listPickerRow}>
      {list.imageUrl ? (
        <Image
          source={{ uri: list.imageUrl }}
          style={styles.listPickerImage}
          contentFit="cover"
          cachePolicy="memory-disk"
          recyclingKey={`lp-${list.id}`}
          transition={0}
        />
      ) : (
        <PosterGrid items={list.items} size={48} />
      )}
      <View style={styles.listPickerInfo}>
        <Text style={styles.listPickerName} numberOfLines={1}>
          {list.name}
        </Text>
        <Text style={styles.listPickerCount}>{list.items.length} éléments</Text>
      </View>
      <Pressable onPress={() => onToggle(list.id)} hitSlop={8}>
        <Animated.View
          style={{
            transform: [{ scale }],
          }}
        >
          <View style={{ width: 22, height: 22, justifyContent: 'center', alignItems: 'center' }}>
            {isAdded ? (
              <View
                style={{
                  width: 19,
                  height: 19,
                  borderRadius: 10,
                  backgroundColor: '#22c55e',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Check size={14} strokeWidth={2.7} color="#121212" />
              </View>
            ) : (
              <CirclePlus strokeWidth={1.9} size={22} color="#fff" />
            )}
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const ItemDetailSheet = forwardRef<ItemDetailSheetRef, ItemDetailSheetProps>(
  function ItemDetailSheet({ item, visible, onClose, initialShowAddToList, items, currentIndex }, ref) {
    const { content, language } = useLanguageStore();
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const [details, setDetails] = useState<FullMediaDetails | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);
    const [providers, setProviders] = useState<Platform[]>([]);
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showAddToList, setShowAddToList] = useState(false);
    const [addedToLists, setAddedToLists] = useState<Set<string>>(new Set());
    const addListOpacity = useRef(new Animated.Value(0)).current;

    const { data: watchlistsData } = useMyWatchlists();
    const watchlists = useMemo(
      () =>
        (watchlistsData?.watchlists ?? []).filter(
          w => w.isOwner === true || w.isCollaborator === true
        ),
      [watchlistsData?.watchlists]
    );

    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    // Expose present/dismiss via ref
    useImperativeHandle(ref, () => ({
      present: () => bottomSheetModalRef.current?.present(),
      dismiss: () => bottomSheetModalRef.current?.dismiss(),
    }));

    // Sync visible prop with bottom sheet present/dismiss
    useEffect(() => {
      if (visible && item) {
        bottomSheetModalRef.current?.present();
      } else {
        bottomSheetModalRef.current?.dismiss();
      }
    }, [visible, item]);

    const handleDismiss = useCallback(() => {
      onClose();
    }, [onClose]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.7}
          pressBehavior="close"
        />
      ),
      []
    );

    // Reset states when item changes
    useEffect(() => {
      setIsDescriptionExpanded(false);
      setAddedToLists(new Set());
      setShowAddToList(initialShowAddToList ?? false);
    }, [item?.tmdbId]);

    // Animate add-to-list overlay
    useEffect(() => {
      if (showAddToList) {
        Animated.timing(addListOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }, [showAddToList]);

    const handleBackFromAddList = useCallback(() => {
      Animated.timing(addListOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start(() => {
        setShowAddToList(false);
      });
    }, [addListOpacity]);

    const langMap: Record<string, string> = {
      fr: 'fr-FR',
      en: 'en-US',
      es: 'es-ES',
      de: 'de-DE',
      it: 'it-IT',
      pt: 'pt-BR',
    };

    // Pre-check which lists already contain this item
    useEffect(() => {
      if (showAddToList && item) {
        const existing = new Set<string>();
        for (const list of watchlists) {
          if (list.items.some((i: WatchlistItem) => i.tmdbId === item.tmdbId)) {
            existing.add(list.id);
          }
        }
        setAddedToLists(existing);
      }
    }, [showAddToList, item?.tmdbId, watchlists]);

    const handleToggleList = useCallback(
      async (listId: string) => {
        if (!item) return;
        const isCurrentlyAdded = addedToLists.has(listId);

        // Optimistic update — immediately toggle the UI
        if (isCurrentlyAdded) {
          setAddedToLists(prev => {
            const next = new Set(prev);
            next.delete(listId);
            return next;
          });
        } else {
          setAddedToLists(prev => new Set(prev).add(listId));
        }

        try {
          if (isCurrentlyAdded) {
            await watchlistAPI.removeItem(listId, item.tmdbId.toString());
          } else {
            await watchlistAPI.addItem(listId, {
              tmdbId: item.tmdbId.toString(),
              mediaType: item.mediaType,
              language: langMap[language] || 'fr-FR',
            });
          }
          mutate('/watchlists/mine');
          mutate(`/watchlists/${listId}`);
        } catch (error: any) {
          // Revert on error
          if (isCurrentlyAdded) {
            setAddedToLists(prev => new Set(prev).add(listId));
          } else {
            setAddedToLists(prev => {
              const next = new Set(prev);
              next.delete(listId);
              return next;
            });
          }
          Toast.show({ type: 'error', text1: error?.message || 'Erreur' });
        }
      },
      [item, addedToLists, language]
    );

    useEffect(() => {
      if (item && visible) {
        loadDetails();
      } else {
        setDetails(null);
        setProviders(prev => (prev.length === 0 ? prev : []));
        setIsDescriptionExpanded(false);
      }
    }, [item, visible]);

    const loadDetails = async () => {
      if (!item) return;
      setIsLoadingDetails(true);
      setDetails(null);
      try {
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

    const posterUrl = item.posterPath
      ? getTMDBImageUrl(item.posterPath, 'w185')
      : details?.posterUrl
        ? getTMDBImageUrl(details.posterUrl, 'w185')
        : null;
    const rating = details?.rating;
    const overview = details?.overview;
    const releaseYear = details?.releaseDate ? new Date(details.releaseDate).getFullYear() : null;
    const genres = details?.genres ?? [];

    const metaParts = [typeLabel, durationText, releaseYear].filter(Boolean);
    const metaText = metaParts.join(' \u00B7 ');

    const matchedProviders = getMatchedProviders(
      providers.length > 0 ? providers : item.platformList
    );
    const cast = details?.cast?.slice(0, 3) ?? [];

    return (
      <BottomSheetModal
        ref={bottomSheetModalRef}
        snapPoints={['85%']}
        enableDynamicSizing={false}
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: 'rgba(255,255,255,0.25)', width: 36 }}
        backgroundStyle={{
          backgroundColor: theme.panel,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <BottomSheetScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {showAddToList ? (
            <Animated.View style={[styles.addToListOverlay, { opacity: addListOpacity }]}>
              <View style={styles.addToListHeader}>
                <Pressable onPress={handleBackFromAddList} hitSlop={8}>
                  <ChevronLeft size={24} color="#fff" />
                </Pressable>
                <Text style={styles.addToListTitle}>Ajouter à une liste</Text>
                <View style={{ width: 24 }} />
              </View>
              <ScrollView
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.lg) }}
              >
                {watchlists.map(list => (
                  <ListPickerRow
                    key={list.id}
                    list={list}
                    isAdded={addedToLists.has(list.id)}
                    onToggle={handleToggleList}
                  />
                ))}
              </ScrollView>
            </Animated.View>
          ) : (
            <>
              {/* Poster + info row */}
              <View style={styles.topRow}>
                {posterUrl ? (
                  <Image
                    source={{ uri: posterUrl }}
                    style={styles.posterImage}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    recyclingKey={`detail-${item.tmdbId}`}
                    transition={0}
                  />
                ) : (
                  <View style={[styles.posterImage, { backgroundColor: theme.muted }]} />
                )}
                {isLoadingDetails ? (
                  <View style={styles.infoColumn}>
                    <SkeletonTextBlock />
                  </View>
                ) : (
                  <View style={styles.infoColumn}>
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
                    {genres.length > 0 && (
                      <View style={styles.genreRow}>
                        {genres.map(genre => (
                          <View key={genre} style={styles.genreBadge}>
                            <Text style={styles.genreBadgeText}>{genre}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {isLoadingDetails ? (
                <SkeletonDetailsBlock />
              ) : (
                <>
                  {/* Description section — full width, expandable */}
                  {overview ? (
                    <View style={styles.descriptionSection}>
                      <Pressable onPress={() => setIsDescriptionExpanded(prev => !prev)}>
                        <Text
                          style={styles.overview}
                          numberOfLines={isDescriptionExpanded ? undefined : 3}
                        >
                          {overview}
                        </Text>
                        <Text style={styles.descriptionToggle}>
                          {isDescriptionExpanded ? 'Voir moins' : 'Voir plus'}
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}

                  {/* Details section below poster row */}
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
                                    cachePolicy="memory-disk"
                                    recyclingKey={`cast-${actor.name}`}
                                    transition={0}
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

              {/* Big "Add to list" button at the bottom */}
              <View
                style={[
                  styles.addToListSection,
                  { paddingBottom: Math.max(spacing.lg, insets.bottom + spacing.md) },
                ]}
              >
                <Pressable style={styles.addToListBtn} onPress={() => setShowAddToList(true)}>
                  <Plus size={18} color={colors.primaryForeground} strokeWidth={2.5} />
                  <Text style={styles.addToListBtnText}>{content.watchlists.addToWatchlist}</Text>
                </Pressable>
              </View>
            </>
          )}
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

export default ItemDetailSheet;

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.md,
  },
  // Poster + info row
  topRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  posterImage: {
    width: POSTER_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
  },
  infoColumn: {
    flex: 1,
    marginLeft: 16,
  },
  titleText: {
    fontSize: 18,
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
  // Genre badges
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: spacing.sm,
  },
  genreBadge: {
    backgroundColor: '#2a2a2a',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genreBadgeText: {
    color: '#fff',
    fontSize: 12,
  },
  // Description section
  descriptionSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  overview: {
    fontSize: fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
  descriptionToggle: {
    color: '#b3b3b3',
    fontSize: 13,
    marginTop: spacing.xs,
  },
  // Details section below poster row
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
  // Big "Add to list" button at the bottom
  addToListSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  addToListBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  addToListBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primaryForeground,
  },
  // Inline add-to-list overlay
  addToListOverlay: {
    flex: 1,
  },
  addToListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  addToListTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.foreground,
  },
  listPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    gap: spacing.md,
  },
  listPickerImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.sm,
  },
  listPickerInfo: {
    flex: 1,
  },
  listPickerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.foreground,
  },
  listPickerCount: {
    fontSize: 13.5,
    color: colors.mutedForeground,
    marginTop: 2,
  },
});
