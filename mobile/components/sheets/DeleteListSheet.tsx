import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { mutate } from 'swr'
import { watchlistAPI } from '../../lib/api-client'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { Watchlist } from '../../types'

export interface DeleteListSheetRef {
  present: (watchlist: { id: string; name: string }) => void
  dismiss: () => void
}

interface DeleteListSheetProps {
  onDeleted?: () => void
}

const DeleteListSheet = forwardRef<DeleteListSheetRef, DeleteListSheetProps>(function DeleteListSheet(
  { onDeleted },
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [targetList, setTargetList] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useImperativeHandle(ref, () => ({
    present: (watchlist: { id: string; name: string }) => {
      setTargetList(watchlist)
      setIsDeleting(false)
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

  const handleCancel = useCallback(() => {
    bottomSheetRef.current?.dismiss()
  }, [])

  const handleDelete = useCallback(async () => {
    if (!targetList || isDeleting) return

    setIsDeleting(true)

    // Optimistic update: remove the list from cache
    await mutate(
      '/watchlists/mine',
      (current: { watchlists: Watchlist[] } | undefined) => {
        const existing = current?.watchlists ?? []
        return { watchlists: existing.filter((w) => w.id !== targetList.id) }
      },
      false,
    )

    try {
      await watchlistAPI.delete(targetList.id)

      // Revalidate with server data
      await mutate('/watchlists/mine')

      Toast.show({ type: 'success', text1: 'Liste supprimée' })
      bottomSheetRef.current?.dismiss()
      onDeleted?.()
    } catch (error) {
      // Rollback on error
      await mutate('/watchlists/mine')
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de la suppression',
      })
    } finally {
      setIsDeleting(false)
    }
  }, [targetList, isDeleting])

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
      <BottomSheetView style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {/* Title */}
        <Text style={styles.title}>Supprimer cette liste ?</Text>

        {/* List name */}
        {targetList && (
          <Text style={styles.listName} numberOfLines={2}>
            {targetList.name}
          </Text>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancelBtn, { backgroundColor: theme.secondary }]}
            onPress={handleCancel}
            disabled={isDeleting}
          >
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.deleteBtn,
              isDeleting && styles.deleteBtnDisabled,
            ]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.destructiveForeground} />
            ) : (
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

export default DeleteListSheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  listName: {
    fontSize: fontSize.base,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
  deleteBtn: {
    backgroundColor: colors.destructive,
  },
  deleteBtnDisabled: {
    opacity: 0.5,
  },
  deleteBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.destructiveForeground,
  },
})
