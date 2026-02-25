import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { Plus, Trash2, ArrowUpToLine, ArrowDownToLine } from 'lucide-react-native'
import { useTheme } from '../../hooks/useTheme'
import { useLanguageStore } from '../../store/language'
import { getTMDBImageUrl } from '../../lib/utils'
import type { WatchlistItem } from '../../types'

interface PresentData {
  item: WatchlistItem
  index: number
  totalItems: number
  canEdit: boolean
  watchlistId: string
}

export interface ItemActionsSheetRef {
  present: (data: PresentData) => void
  dismiss: () => void
}

interface ItemActionsSheetProps {
  onDelete: (tmdbId: number) => void
  onMoveToFirst: (item: WatchlistItem) => void
  onMoveToLast: (item: WatchlistItem) => void
  onAddToList: (item: WatchlistItem) => void
}

const ItemActionsSheet = forwardRef<ItemActionsSheetRef, ItemActionsSheetProps>(
  function ItemActionsSheet({ onDelete, onMoveToFirst, onMoveToLast, onAddToList }, ref) {
    const theme = useTheme()
    const { content } = useLanguageStore()
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    // no snapPoints — using enableDynamicSizing

    const [data, setData] = useState<PresentData | null>(null)

    useImperativeHandle(ref, () => ({
      present: (presentData: PresentData) => {
        setData(presentData)
        bottomSheetRef.current?.present()
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }))

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
      [],
    )

    const dismiss = useCallback(() => {
      bottomSheetRef.current?.dismiss()
    }, [])

    const handleAddToList = useCallback(() => {
      if (!data) return
      onAddToList(data.item)
      dismiss()
    }, [data, onAddToList, dismiss])

    const handleDelete = useCallback(() => {
      if (!data) return
      onDelete(data.item.tmdbId)
      dismiss()
    }, [data, onDelete, dismiss])

    const handleMoveToFirst = useCallback(() => {
      if (!data || data.index === 0) return
      onMoveToFirst(data.item)
      dismiss()
    }, [data, onMoveToFirst, dismiss])

    const handleMoveToLast = useCallback(() => {
      if (!data || data.index === data.totalItems - 1) return
      onMoveToLast(data.item)
      dismiss()
    }, [data, onMoveToLast, dismiss])

    const typeLabel = data
      ? data.item.mediaType === 'movie'
        ? content.watchlists.contentTypes.movie
        : content.watchlists.contentTypes.series
      : ''

    const posterUrl = data ? getTMDBImageUrl(data.item.posterPath, 'w154') : null

    const isFirst = data ? data.index === 0 : false
    const isLast = data ? data.index === data.totalItems - 1 : false

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{
          backgroundColor: 'rgba(255,255,255,0.25)',
          width: 36,
        }}
        backgroundStyle={{
          backgroundColor: theme.panel,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <BottomSheetView style={styles.container}>
          {/* Header */}
          {data && (
            <View style={styles.header}>
              {posterUrl ? (
                <Image
                  source={{ uri: posterUrl }}
                  style={styles.headerPoster}
                  contentFit="cover"
                />
              ) : (
                <View style={[styles.headerPoster, styles.headerPosterEmpty]} />
              )}
              <View style={styles.headerInfo}>
                <Text style={styles.headerTitle} numberOfLines={2}>
                  {data.item.title}
                </Text>
                <Text style={styles.headerType}>{typeLabel}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actions}>
            {/* Add to another list — always visible */}
            <Pressable style={styles.actionRow} onPress={handleAddToList}>
              <Plus size={22} color="#b3b3b3" />
              <Text style={styles.actionText}>Ajouter à une autre liste</Text>
            </Pressable>

            {/* Delete from list — only if canEdit */}
            {data?.canEdit && (
              <Pressable style={styles.actionRow} onPress={handleDelete}>
                <Trash2 size={22} color="#ef4444" />
                <Text style={[styles.actionText, styles.actionTextDestructive]}>
                  Supprimer de cette liste
                </Text>
              </Pressable>
            )}

            {/* Move to first — only if canEdit */}
            {data?.canEdit && (
              <Pressable
                style={[styles.actionRow, isFirst && styles.actionRowDisabled]}
                onPress={handleMoveToFirst}
                disabled={isFirst}
              >
                <ArrowUpToLine size={22} color="#b3b3b3" />
                <Text style={styles.actionText}>Déplacer en première position</Text>
              </Pressable>
            )}

            {/* Move to last — only if canEdit */}
            {data?.canEdit && (
              <Pressable
                style={[styles.actionRow, isLast && styles.actionRowDisabled]}
                onPress={handleMoveToLast}
                disabled={isLast}
              >
                <ArrowDownToLine size={22} color="#b3b3b3" />
                <Text style={styles.actionText}>Déplacer en dernière position</Text>
              </Pressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

export default ItemActionsSheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333333',
  },
  headerPoster: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#2a2a2a',
  },
  headerPosterEmpty: {
    backgroundColor: '#282828',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
  },
  headerType: {
    fontSize: 12,
    color: '#b3b3b3',
    marginTop: 2,
  },
  actions: {
    paddingTop: 8,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 14,
  },
  actionRowDisabled: {
    opacity: 0.3,
  },
  actionText: {
    fontSize: 15,
    color: '#f8fafc',
  },
  actionTextDestructive: {
    color: '#ef4444',
  },
})
