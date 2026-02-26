import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
} from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Pencil, ImagePlus, X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

export interface ListMenuSheetRef {
  present: () => void
  dismiss: () => void
}

interface ListMenuSheetProps {
  onEdit: () => void
  onCoverPhoto: () => void
  onDelete: () => void
}

const ListMenuSheet = forwardRef<ListMenuSheetRef, ListMenuSheetProps>(
  function ListMenuSheet({ onEdit, onCoverPhoto, onDelete }, ref) {
    const theme = useTheme()
    const insets = useSafeAreaInsets()
    const bottomSheetRef = useRef<BottomSheetModal>(null)

    useImperativeHandle(ref, () => ({
      present: () => bottomSheetRef.current?.present(),
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

    const handleEdit = useCallback(() => {
      bottomSheetRef.current?.dismiss()
      onEdit()
    }, [onEdit])

    const handleCoverPhoto = useCallback(() => {
      bottomSheetRef.current?.dismiss()
      onCoverPhoto()
    }, [onCoverPhoto])

    const handleDelete = useCallback(() => {
      bottomSheetRef.current?.dismiss()
      onDelete()
    }, [onDelete])

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
          <Pressable style={styles.actionRow} onPress={handleEdit}>
            <Pencil size={22} color={colors.foreground} />
            <Text style={styles.actionText}>Modifier la liste</Text>
          </Pressable>

          <Pressable style={styles.actionRow} onPress={handleCoverPhoto}>
            <ImagePlus size={22} color={colors.foreground} />
            <Text style={styles.actionText}>Ajouter une photo de couverture</Text>
          </Pressable>

          <Pressable style={styles.actionRow} onPress={handleDelete}>
            <X size={22} color="#ef4444" />
            <Text style={styles.actionText}>
              Supprimer la liste
            </Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

export default ListMenuSheet

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  actionText: {
    fontSize: fontSize.base,
    color: colors.foreground,
  },
})
