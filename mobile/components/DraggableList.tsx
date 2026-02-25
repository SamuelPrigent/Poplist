import { useCallback } from 'react'
import { Alert } from 'react-native'
import Toast from 'react-native-toast-message'
import { mutate } from 'swr'
import { watchlistAPI } from '../lib/api-client'
import type { Watchlist, WatchlistItem } from '../types'

// TODO: expo-haptics is not currently installed.
// Once installed, add haptic feedback on long-press activation:
//   import * as Haptics from 'expo-haptics'
//   Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

interface UseReorderActionsOptions {
  watchlistId: string
  watchlist: Watchlist | null
  setWatchlist: React.Dispatch<React.SetStateAction<Watchlist | null>>
}

/**
 * Hook providing move-to-top and move-to-bottom actions for watchlist items.
 *
 * This is a lightweight alternative to full visual drag-and-drop.
 * A complete drag-to-reorder implementation can be added later using
 * react-native-reanimated + gesture handler.
 */
export function useReorderActions({
  watchlistId,
  watchlist,
  setWatchlist,
}: UseReorderActionsOptions) {
  const moveToTop = useCallback(
    async (tmdbId: number) => {
      if (!watchlist) return

      const previousItems = watchlist.items
      const itemIndex = previousItems.findIndex((i) => i.tmdbId === tmdbId)
      if (itemIndex <= 0) return // Already at top or not found

      // Optimistic: move item to first position
      const item = previousItems[itemIndex]
      const newItems = [item, ...previousItems.filter((i) => i.tmdbId !== tmdbId)]
      setWatchlist((prev) => (prev ? { ...prev, items: newItems } : prev))

      try {
        await watchlistAPI.moveItem(watchlistId, tmdbId.toString(), 'first')
        mutate(`/watchlists/${watchlistId}`)
        Toast.show({ type: 'success', text1: 'D\u00e9plac\u00e9 en t\u00eate de liste' })
      } catch {
        // Rollback
        setWatchlist((prev) => (prev ? { ...prev, items: previousItems } : prev))
        Toast.show({ type: 'error', text1: 'Erreur lors du d\u00e9placement' })
      }
    },
    [watchlist, watchlistId, setWatchlist],
  )

  const moveToBottom = useCallback(
    async (tmdbId: number) => {
      if (!watchlist) return

      const previousItems = watchlist.items
      const itemIndex = previousItems.findIndex((i) => i.tmdbId === tmdbId)
      if (itemIndex === -1 || itemIndex === previousItems.length - 1) return // Already at bottom or not found

      // Optimistic: move item to last position
      const item = previousItems[itemIndex]
      const newItems = [...previousItems.filter((i) => i.tmdbId !== tmdbId), item]
      setWatchlist((prev) => (prev ? { ...prev, items: newItems } : prev))

      try {
        await watchlistAPI.moveItem(watchlistId, tmdbId.toString(), 'last')
        mutate(`/watchlists/${watchlistId}`)
        Toast.show({ type: 'success', text1: 'D\u00e9plac\u00e9 en fin de liste' })
      } catch {
        // Rollback
        setWatchlist((prev) => (prev ? { ...prev, items: previousItems } : prev))
        Toast.show({ type: 'error', text1: 'Erreur lors du d\u00e9placement' })
      }
    },
    [watchlist, watchlistId, setWatchlist],
  )

  /**
   * Shows an action sheet with reorder options for the given item.
   * Call this from a long-press handler on WatchlistItemRow.
   */
  const showReorderMenu = useCallback(
    (item: WatchlistItem) => {
      if (!watchlist) return

      const itemIndex = watchlist.items.findIndex((i) => i.tmdbId === item.tmdbId)
      const isFirst = itemIndex === 0
      const isLast = itemIndex === watchlist.items.length - 1

      const buttons: Array<{ text: string; onPress?: () => void; style?: 'cancel' | 'destructive' | 'default' }> = []

      if (!isFirst) {
        buttons.push({
          text: 'D\u00e9placer en t\u00eate',
          onPress: () => moveToTop(item.tmdbId),
        })
      }

      if (!isLast) {
        buttons.push({
          text: 'D\u00e9placer en fin',
          onPress: () => moveToBottom(item.tmdbId),
        })
      }

      buttons.push({ text: 'Annuler', style: 'cancel' })

      Alert.alert(item.title, undefined, buttons)
    },
    [watchlist, moveToTop, moveToBottom],
  )

  return { moveToTop, moveToBottom, showReorderMenu }
}
