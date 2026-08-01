import { View, Text, StyleSheet, ActivityIndicator, Pressable, Dimensions } from 'react-native';
import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  withTiming,
  Easing,
  useAnimatedRef,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { User as UserIcon, Plus } from 'lucide-react-native';
import Sortable from 'react-native-sortables';
import * as Haptics from 'expo-haptics';
import Toast from 'react-native-toast-message';
import { mutate } from '../../../hooks/queries';
import { useMyWatchlists } from '../../../hooks/queries';
import { watchlistAPI } from '../../../lib/api-client';
import { useLanguageStore } from '../../../store/language';
import { useAuth } from '../../../context/auth-context';
import UserMenuPopover, { type UserMenuPopoverRef } from '../../../components/UserMenuPopover';
import { colors, fontSize, spacing, borderRadius } from '../../../constants/theme';
import { GRID_COLUMNS } from '../../../constants/layout';
import { useTheme } from '../../../hooks/useTheme';
import WatchlistCard from '../../../components/WatchlistCard';
import PrimaryButton from '../../../components/PrimaryButton';
import EmptyState from '../../../components/EmptyState';
import CreateListSheet, { type CreateListSheetRef } from '../../../components/sheets/CreateListSheet';
import DeleteListSheet, { type DeleteListSheetRef } from '../../../components/sheets/DeleteListSheet';
import type { Watchlist } from '../../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function getCardWidth(cols: number) {
  if (cols === 1) return SCREEN_WIDTH - spacing.lg * 2;
  return (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm * (cols - 1)) / cols;
}


export default function ListsScreen() {
  const { content } = useLanguageStore();
  // Affichage TOUJOURS en grille : l'option grille/liste a été retirée
  // des préférences (demande explicite).
  const { user } = useAuth();
  const theme = useTheme();
  const cardWidth = getCardWidth(GRID_COLUMNS);
  const router = useRouter();
  const userMenuRef = useRef<UserMenuPopoverRef>(null)
  const avatarRef = useRef<View>(null);
  const { data, isLoading } = useMyWatchlists();

  // Local state for ordering (optimistic updates)
  const [orderedWatchlists, setOrderedWatchlists] = useState<Watchlist[]>([]);

  // Sync SWR data to local state
  useEffect(() => {
    if (data?.watchlists) {
      setOrderedWatchlists(data.watchlists);
    }
  }, [data?.watchlists]);

  // ScrollView ref for auto-scroll during drag
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  // Scroll-based FAB animation
  const lastScrollY = useSharedValue(0);
  const buttonTranslateY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: event => {
      const y = event.contentOffset.y;
      const diff = y - lastScrollY.value;
      const timingConfig = { duration: 200, easing: Easing.out(Easing.quad) };
      if (diff > 5 && y > 50) {
        buttonTranslateY.value = withTiming(200, timingConfig);
      } else if (diff < -5) {
        buttonTranslateY.value = withTiming(0, timingConfig);
      }
      lastScrollY.value = y;
    },
  });

  // Sheet refs
  const createListRef = useRef<CreateListSheetRef>(null);
  const deleteListRef = useRef<DeleteListSheetRef>(null);

  const handleCreateList = useCallback(() => {
    createListRef.current?.present();
  }, []);

  const handleDeleteList = useCallback((watchlist: Watchlist) => {
    deleteListRef.current?.present({ id: watchlist.id, name: watchlist.name });
  }, []);

  // Plus de filtres « Mes listes / Suivies » (cf. redesignMobile.md § 6) :
  // un clic inutile. On affiche toujours l'intégralité de la bibliothèque,
  // donc le tri par glisser-déposer est toujours disponible.
  const filteredWatchlists = orderedWatchlists;
  const isSortEnabled = true;

  const handleDragStart = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  // Drag end handler with optimistic update
  const handleDragEnd = useCallback(
    async ({ data: reorderedData }: { data: Watchlist[] }) => {
      const previousOrder = orderedWatchlists;
      setOrderedWatchlists(reorderedData);

      try {
        await watchlistAPI.reorderWatchlists(reorderedData.map(w => w.id));
        mutate('/watchlists/mine');
      } catch {
        setOrderedWatchlists(previousOrder);
        Toast.show({ type: 'error', text1: 'Erreur lors du réordonnancement' });
      }
    },
    [orderedWatchlists]
  );

  // Plus de mode liste : l'app est toujours en grille.

  const renderItem = useCallback(
    ({ item }: { item: Watchlist }) => (
      <WatchlistCard
        watchlist={item}
        showOwner={false}
        width={cardWidth}
      />
    ),
    [cardWidth]
  );

  const keyExtractor = useCallback((item: Watchlist) => item.id, []);

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
        edges={['top']}
      >
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable ref={avatarRef} style={styles.avatarButton} onPress={() =>
              avatarRef.current?.measureInWindow((x, y, width, height) =>
                userMenuRef.current?.present({ x, y, width, height }),
              )
            }>
          {user?.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
              contentFit="cover"
              transition={0}
            />
          ) : (
            <UserIcon size={16} color={colors.mutedForeground} />
          )}
        </Pressable>
        <Text style={styles.title}>Bibliothèque</Text>
      </View>

      {/* Création : bouton pleine largeur en haut (plus de bouton flottant, § 2.6) */}
      <View style={styles.createButtonWrap}>
        <PrimaryButton
          label="Nouvelle liste"
          onPress={handleCreateList}
          icon={<Plus size={16} color={colors.primaryForeground} />}
        />
      </View>

      {filteredWatchlists.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState title={content.watchlists.noWatchlists} />
        </View>
      ) : (
        <Animated.ScrollView
          key={GRID_COLUMNS}
          ref={scrollViewRef}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Sortable.Grid
            data={filteredWatchlists}
            renderItem={renderItem}
            columns={GRID_COLUMNS}
            keyExtractor={keyExtractor}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            sortEnabled={isSortEnabled}
            dragActivationDelay={600}
            hapticsEnabled={false}
            strategy="insert"
            activeItemScale={1.05}
            activeItemOpacity={0.9}
            inactiveItemOpacity={0.6}
            rowGap={spacing.xl}
            columnGap={spacing.sm}
            scrollableRef={scrollViewRef}
            autoScrollEnabled
          />
        </Animated.ScrollView>
      )}

      {/* Sheets */}
      <CreateListSheet ref={createListRef} />
      <DeleteListSheet ref={deleteListRef} />
    
      {/* Popover de la bulle d'avatar (PWA : MobileHeader) */}
      <UserMenuPopover ref={userMenuRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 2,
  },
  avatarButton: {
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 33,
    height: 33,
    borderRadius: 17,
  },
  title: {
    fontSize: fontSize.pageTitle,
    fontWeight: '700',
    color: colors.foreground,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['3xl'],
    gap: spacing.sm,
  },
  filtersCompact: {
    paddingBottom: spacing.lg,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    height: 31,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 0,
    backgroundColor: colors.muted,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 160,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonWrap: {
    paddingHorizontal: spacing.lg,
    // Respiration entre le titre de la page et le bouton (il était collé).
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  createButtonInner: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  createButtonText: {
    color: '#000',
    fontWeight: '700',
    fontSize: fontSize.base,
    paddingInline: 4,
  },
});
