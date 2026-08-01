import { View, Text, StyleSheet, ActivityIndicator, Share, Platform, Pressable, LayoutChangeEvent } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router'
import { useEffect, useState, useLayoutEffect, useCallback, useRef } from 'react'
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle, interpolate, Extrapolation, withTiming, Easing, useAnimatedRef } from 'react-native-reanimated'
import * as ImagePicker from 'expo-image-picker'
import Toast from 'react-native-toast-message'
import Sortable from 'react-native-sortables'
import * as Haptics from 'expo-haptics'
import { mutate } from '../../../../hooks/queries'
import { watchlistAPI } from '../../../../lib/api-client'
import { useAuth } from '../../../../context/auth-context'
import { WEB_APP_URL } from '../../../../constants/api'
import { colors, fontSize, spacing } from '../../../../constants/theme'
import ListHeader from '../../../../components/ListHeader'
import WatchlistItemRow from '../../../../components/WatchlistItemRow'
import { useReorderActions } from '../../../../components/DraggableList'
import ItemDetailSheet from '../../../../components/ItemDetailSheet'
import EmptyState from '../../../../components/EmptyState'
import ListRecommendations from '../../../../components/ListRecommendations'
import EditListSheet from '../../../../components/sheets/EditListSheet'
import CollaboratorSheet from '../../../../components/sheets/CollaboratorSheet'
import LeaveListSheet from '../../../../components/sheets/LeaveListSheet'
import DeleteListSheet from '../../../../components/sheets/DeleteListSheet'
import ItemActionsSheet from '../../../../components/sheets/ItemActionsSheet'
import SearchSheet from '../../../../components/sheets/SearchSheet'
import ConfirmDeleteSheet from '../../../../components/sheets/ConfirmDeleteSheet'
import ListMenuSheet from '../../../../components/sheets/ListMenuSheet'
import type { EditListSheetRef } from '../../../../components/sheets/EditListSheet'
import type { CollaboratorSheetRef } from '../../../../components/sheets/CollaboratorSheet'
import type { LeaveListSheetRef } from '../../../../components/sheets/LeaveListSheet'
import type { DeleteListSheetRef } from '../../../../components/sheets/DeleteListSheet'
import type { ItemActionsSheetRef } from '../../../../components/sheets/ItemActionsSheet'
import type { SearchSheetRef } from '../../../../components/sheets/SearchSheet'
import type { ConfirmDeleteSheetRef } from '../../../../components/sheets/ConfirmDeleteSheet'
import type { ListMenuSheetRef } from '../../../../components/sheets/ListMenuSheet'
import type { Watchlist, WatchlistItem } from '../../../../types'
import { useLanguageStore } from '../../../../store/language'
import { useTheme } from '../../../../hooks/useTheme'


/**
 * Route : remonte l'`id` en `key` pour FORCER un remontage à chaque liste.
 *
 * React Navigation réutilise l'instance d'écran quand seul le paramètre change
 * (`/list/a` → `/list/b`). L'état restait donc celui de la liste précédente, et
 * la purger dans un `useEffect` ne suffit pas : l'effet ne s'exécute qu'APRÈS
 * la première peinture, si bien que l'ancienne liste s'affichait une frame
 * avant la nouvelle. Le `key` règle le problème à la racine : nouvelle liste =
 * nouvelle instance, donc aucun état résiduel (état, scroll, sheets, animations).
 */
export default function ListDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ListDetailScreen key={id} />
}

function ListDetailScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  const navigation = useNavigation()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { content } = useLanguageStore()
  const { user } = useAuth()
  const [watchlist, setWatchlist] = useState<Watchlist | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isCollaborator, setIsCollaborator] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [openAddToList, setOpenAddToList] = useState(false)
  // Recommandation ouverte : l'élément n'appartient pas à la liste, on
  // construit un WatchlistItem éphémère pour la fiche détail.
  const [recoSheetOpen, setRecoSheetOpen] = useState(false)
  const recoItemRef = useRef<{ tmdbId: number; mediaType: 'movie' | 'tv'; title: string } | null>(
    null,
  )
  const [titleBottomY, setTitleBottomY] = useState(0)

  // Sheet refs
  const editSheetRef = useRef<EditListSheetRef>(null)
  const collaboratorSheetRef = useRef<CollaboratorSheetRef>(null)
  const leaveSheetRef = useRef<LeaveListSheetRef>(null)
  const deleteSheetRef = useRef<DeleteListSheetRef>(null)
  const itemActionsSheetRef = useRef<ItemActionsSheetRef>(null)
  const searchSheetRef = useRef<SearchSheetRef>(null)
  const confirmDeleteRef = useRef<ConfirmDeleteSheetRef>(null)
  const listMenuRef = useRef<ListMenuSheetRef>(null)

  // ScrollView ref for auto-scroll during drag
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>()

  // Animated scroll tracking
  const scrollY = useSharedValue(0)
  const lastScrollY = useSharedValue(0)
  const buttonTranslateY = useSharedValue(0)

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y
      scrollY.value = y

      const diff = y - lastScrollY.value
      const timingConfig = { duration: 200, easing: Easing.out(Easing.quad) }
      if (diff > 5 && y > 100) {
        buttonTranslateY.value = withTiming(200, timingConfig)
      } else if (diff < -5) {
        buttonTranslateY.value = withTiming(0, timingConfig)
      }
      lastScrollY.value = y
    },
  })

  // Callback to measure the title position inside ListHeader
  const handleTitleLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout
    // y + height gives the bottom of the title relative to the ListHeader container
    // We add the contentContainer paddingTop (insets.top + 32) to account for FlatList padding
    setTitleBottomY(y + height)
  }, [])

  // Animated style for the fixed header overlay
  const animatedHeaderStyle = useAnimatedStyle(() => {
    if (titleBottomY === 0) {
      return { opacity: 0 }
    }
    return {
      opacity: interpolate(
        scrollY.value,
        [titleBottomY - 20, titleBottomY + 20],
        [0, 1],
        Extrapolation.CLAMP,
      ),
    }
  })

  // Animated style for the bottom button
  // All hooks MUST be called before any early return (Rules of Hooks)
  const handleDeleteItem = useCallback(async (tmdbId: number) => {
    if (!watchlist || !id) return

    const previousItems = watchlist.items
    setWatchlist((prev) =>
      prev ? { ...prev, items: prev.items.filter((i) => i.tmdbId !== tmdbId) } : prev,
    )

    try {
      await watchlistAPI.removeItem(id, tmdbId.toString())
      mutate(`/watchlists/${id}`)
      mutate('/watchlists/mine')
      Toast.show({ type: 'success', text1: 'Élément retiré' })
    } catch (error) {
      setWatchlist((prev) =>
        prev ? { ...prev, items: previousItems } : prev,
      )
      Toast.show({ type: 'error', text1: 'Erreur lors de la suppression' })
    }
  }, [watchlist, id])

  const { moveToTop, moveToBottom } = useReorderActions({
    watchlistId: id!,
    watchlist,
    setWatchlist,
  })

  useLayoutEffect(() => {
    navigation.setOptions({ headerTitle: '' })
  }, [navigation])

  // Garde-fou anti-réponse obsolète : deux chargements rapprochés peuvent
  // revenir dans le désordre et écraser la bonne liste par l'ancienne.
  // (La purge d'état, elle, est assurée par le remontage via `key`.)
  const requestedIdRef = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!id) return
    requestedIdRef.current = id
    loadWatchlist(id)
  }, [id])

  const loadWatchlist = async (targetId: string | undefined = id) => {
    if (!targetId) return
    try {
      const response = await watchlistAPI.getById(targetId)
      if (requestedIdRef.current !== targetId) return
      setWatchlist(response.watchlist)
      setIsSaved(response.isSaved)
      setIsCollaborator(response.isCollaborator)
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    } finally {
      if (requestedIdRef.current === targetId) setIsLoading(false)
    }
  }

  const handleAddElement = useCallback(() => {
    searchSheetRef.current?.present()
  }, [])

  const handleCoverPhoto = useCallback(async () => {
    if (!watchlist) return

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    })

    if (result.canceled || !result.assets[0]?.base64) return

    try {
      const imageData = `data:image/jpeg;base64,${result.assets[0].base64}`
      const { watchlist: updated } = await watchlistAPI.uploadCover(watchlist.id, imageData)
      setWatchlist(prev => prev ? { ...prev, ...updated, items: prev.items, collaborators: prev.collaborators } : updated)
      mutate(`/watchlists/${watchlist.id}`)
      mutate('/watchlists/mine')
      Toast.show({ type: 'success', text1: 'Photo de couverture mise à jour' })
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de l\'upload',
      })
    }
  }, [watchlist])

  // --- Early returns (after all hooks) ---

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    )
  }

  if (!watchlist) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.background }]}>
        <Text style={styles.error}>Liste introuvable</Text>
      </View>
    )
  }

  const isOwner = watchlist.isOwner === true || watchlist.ownerId === user?.id
  const canEdit = isOwner || isCollaborator

  const handleItemDragStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
  }

  const handleItemDragEnd = async ({ data: reorderedItems }: { data: WatchlistItem[] }) => {
    const previousItems = watchlist.items
    setWatchlist((prev) => prev ? { ...prev, items: reorderedItems } : prev)

    try {
      await watchlistAPI.reorderItems(id!, reorderedItems.map(i => i.tmdbId.toString()))
      mutate(`/watchlists/${id}`)
    } catch {
      setWatchlist((prev) => prev ? { ...prev, items: previousItems } : prev)
      Toast.show({ type: 'error', text1: 'Erreur lors du réordonnancement' })
    }
  }

  const handleShare = async () => {
    const url = `${WEB_APP_URL}/lists/${id}`
    const message = `Découvre la liste "${watchlist.name}" sur Poplist !\n${url}`
    try {
      await Share.share(
        Platform.OS === 'ios'
          ? { message, url }
          : { message },
      )
    } catch (_) {
      // User cancelled or share failed — silent
    }
  }

  const handleSaveToggle = async () => {
    if (!id) return

    const wasSaved = isSaved
    setIsSaved(!wasSaved)
    setWatchlist((prev) =>
      prev
        ? {
            ...prev,
            followersCount: (prev.followersCount ?? 0) + (wasSaved ? -1 : 1),
          }
        : prev,
    )

    try {
      if (wasSaved) {
        await watchlistAPI.unsaveWatchlist(id)
      } else {
        await watchlistAPI.saveWatchlist(id)
      }
      mutate('/watchlists/mine')
      mutate(`/watchlists/${id}`)
      Toast.show({
        type: 'success',
        text1: wasSaved ? 'Liste retirée' : 'Liste sauvegardée',
      })
    } catch (error) {
      setIsSaved(wasSaved)
      setWatchlist((prev) =>
        prev
          ? {
              ...prev,
              followersCount: (prev.followersCount ?? 0) + (wasSaved ? 1 : -1),
            }
          : prev,
      )
      Toast.show({ type: 'error', text1: 'Erreur' })
    }
  }

  const handleDuplicate = async () => {
    if (!id) return

    try {
      const { watchlist: newList } = await watchlistAPI.duplicateWatchlist(id)
      mutate('/watchlists/mine')
      Toast.show({ type: 'success', text1: 'Liste dupliquée' })
      router.push(`/list/${newList.id}`)
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de la duplication',
      })
    }
  }

  const handleEdit = () => {
    if (!watchlist) return
    editSheetRef.current?.present({
      id: watchlist.id,
      name: watchlist.name,
      description: watchlist.description ?? undefined,
      genres: watchlist.genres ?? undefined,
    })
  }

  const handleEditUpdated = (updated: Watchlist) => {
    setWatchlist(prev => prev ? { ...prev, ...updated, items: updated.items ?? prev.items, collaborators: updated.collaborators ?? prev.collaborators, owner: updated.owner ?? prev.owner } : updated)
  }

  const handleAddCollaborator = () => {
    if (!watchlist) return
    collaboratorSheetRef.current?.present({
      id: watchlist.id,
      collaborators: watchlist.collaborators,
    })
  }

  const handleCollaboratorsChanged = (collaborators: Watchlist['collaborators']) => {
    setWatchlist((prev) => (prev ? { ...prev, collaborators } : prev))
    mutate('/watchlists/mine')
  }

  const handleDelete = () => {
    if (!watchlist) return
    deleteSheetRef.current?.present({ id: watchlist.id, name: watchlist.name })
  }

  const handleLeave = () => {
    if (!watchlist) return
    leaveSheetRef.current?.present({ id: watchlist.id, name: watchlist.name })
  }

  const handleLeftList = () => {
    router.back()
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <Animated.ScrollView
        ref={scrollViewRef}
        style={styles.list}
        contentContainerStyle={[styles.contentContainer, { paddingTop: insets.top + 32, paddingBottom: 160 }]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View>
          <ListHeader
            watchlist={watchlist}
            isOwner={isOwner}
            isSaved={isSaved}
            isCollaborator={isCollaborator}
            scrollY={scrollY}
            onShare={handleShare}
            onSave={handleSaveToggle}
            onMenu={() => listMenuRef.current?.present()}
            onDuplicate={handleDuplicate}
            onAddElement={canEdit ? handleAddElement : undefined}
            onAddCollaborator={handleAddCollaborator}
            onLeave={handleLeave}
            onTitleLayout={handleTitleLayout}
          />
        </View>

        {/* Items */}
        {!watchlist.items?.length ? (
          <EmptyState
            title={content.watchlists.noItemsYet}
            description={content.watchlists.noItemsDescription}
          />
        ) : (
          <Sortable.Grid
            data={watchlist.items}
            renderItem={({ item, index }: { item: WatchlistItem; index: number }) => (
              <WatchlistItemRow
                item={item}
                onPress={() => setSelectedIndex(index)}
                // Remplace l'ancien menu « … » : ouvre directement le
                // sélecteur de listes, comme le « + » de la PWA.
                onPickerPress={() => {
                  setOpenAddToList(true)
                  setSelectedIndex(index)
                }}
                // Sur une liste qui m'appartient, l'élément est par définition
                // dans une de mes listes → coche verte. Sur la liste d'un
                // autre utilisateur, on ne peut pas le savoir sans charger mes
                // listes : on laisse le « + ».
                isInMyLists={canEdit}
                // Poignée de réordonnancement : propriétaire uniquement.
                showGrip={isOwner}
              />
            )}
            columns={1}
            keyExtractor={(item: WatchlistItem) => item.tmdbId.toString()}
            onDragStart={handleItemDragStart}
            onDragEnd={handleItemDragEnd}
            sortEnabled={canEdit}
            dragActivationDelay={600}
            hapticsEnabled={false}
            strategy="insert"
            activeItemScale={1.02}
            activeItemOpacity={0.9}
            inactiveItemOpacity={0.5}
            rowGap={0}
            scrollableRef={scrollViewRef}
            autoScrollEnabled
          />
        )}

        {/* Recommandations (endpoint dédié, hook généré par Kubb) */}
        {id && (
          <ListRecommendations
            watchlistId={id}
            onOpenDetails={(tmdbId, mediaType, title) => {
              recoItemRef.current = { tmdbId, mediaType, title }
              setRecoSheetOpen(true)
            }}
            onAdd={(tmdbId, mediaType, title) => {
              recoItemRef.current = { tmdbId, mediaType, title }
              setRecoSheetOpen(true)
              setOpenAddToList(true)
            }}
          />
        )}
      </Animated.ScrollView>

      {/* Animated fixed header overlay */}
      <Animated.View
        style={[
          styles.fixedHeader,
          {
            paddingTop: insets.top,
            height: insets.top + 44,
            backgroundColor: theme.background,
          },
          animatedHeaderStyle,
        ]}
        pointerEvents="box-none"
      >
        <Text style={styles.fixedHeaderTitle} numberOfLines={1}>
          {watchlist.name}
        </Text>
      </Animated.View>

      <ItemDetailSheet
        item={selectedIndex !== null ? watchlist.items[selectedIndex] : null}
        visible={selectedIndex !== null}
        onClose={() => {
          setSelectedIndex(null)
          setOpenAddToList(false)
        }}
        initialShowAddToList={openAddToList}
        items={watchlist.items}
        currentIndex={selectedIndex ?? 0}
        onNavigate={setSelectedIndex}
      />

      {/* Fiche d'une recommandation : l'élément n'est pas dans la liste, on
          construit un item éphémère (mêmes champs neutres que l'accueil). */}
      <ItemDetailSheet
        item={
          recoSheetOpen && recoItemRef.current
            ? {
                id: `tmdb-${recoItemRef.current.tmdbId}`,
                watchlistId: null,
                tmdbId: recoItemRef.current.tmdbId,
                title: recoItemRef.current.title,
                posterPath: null,
                backdropPath: null,
                overview: null,
                releaseDate: null,
                voteAverage: null,
                runtime: null,
                numberOfSeasons: null,
                numberOfEpisodes: null,
                position: null,
                mediaType: recoItemRef.current.mediaType,
                platformList: [],
                addedAt: new Date().toISOString(),
              }
            : null
        }
        visible={recoSheetOpen}
        onClose={() => {
          setRecoSheetOpen(false)
          setOpenAddToList(false)
        }}
        initialShowAddToList={openAddToList}
      />

      {/* Bottom sheets */}
      <EditListSheet ref={editSheetRef} onUpdated={handleEditUpdated} />
      <CollaboratorSheet ref={collaboratorSheetRef} onCollaboratorsChanged={handleCollaboratorsChanged} />
      <LeaveListSheet ref={leaveSheetRef} onLeft={handleLeftList} />
      <DeleteListSheet ref={deleteSheetRef} onDeleted={() => router.back()} />
      <ItemActionsSheet
        ref={itemActionsSheetRef}
        onDelete={(tmdbId) => {
          confirmDeleteRef.current?.present({
            title: 'Supprimer cet élément ?',
            onConfirm: () => handleDeleteItem(tmdbId),
          })
        }}
        onMoveToFirst={(item) => moveToTop(item.tmdbId)}
        onMoveToLast={(item) => moveToBottom(item.tmdbId)}
        onAddToList={(item) => {
          const index = watchlist.items.findIndex(i => i.tmdbId === item.tmdbId)
          if (index !== -1) {
            setOpenAddToList(true)
            setSelectedIndex(index)
          }
        }}
      />
      <SearchSheet ref={searchSheetRef} watchlistId={id} onItemAdded={() => loadWatchlist()} />
      <ConfirmDeleteSheet ref={confirmDeleteRef} />
      <ListMenuSheet
        ref={listMenuRef}
        onEdit={handleEdit}
        onCoverPhoto={handleCoverPhoto}
        onDelete={handleDelete}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    alignItems: 'center',
    // Titre CENTRÉ dans la hauteur du header (44px) : la flèche de retour
    // native l'est aussi, donc les deux s'alignent. Avec `flex-end` +
    // paddingBottom, le titre tombait plus bas que la flèche.
    justifyContent: 'center',
    // Marge à gauche/droite pour ne pas passer sous la flèche ni le bouton.
    paddingHorizontal: 56,
  },
  fixedHeaderTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  error: {
    fontSize: fontSize.base,
    color: colors.destructive,
  },
})
