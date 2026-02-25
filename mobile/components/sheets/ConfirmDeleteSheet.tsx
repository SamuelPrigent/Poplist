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
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

export interface ConfirmDeleteSheetRef {
  present: (data: { title: string; onConfirm: () => void }) => void
  dismiss: () => void
}

const ConfirmDeleteSheet = forwardRef<ConfirmDeleteSheetRef>(
  function ConfirmDeleteSheet(_props, ref) {
    const theme = useTheme()
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const snapPoints = ['30%']

    const [title, setTitle] = useState('')
    const onConfirmRef = useRef<(() => void) | null>(null)

    useImperativeHandle(ref, () => ({
      present: (data: { title: string; onConfirm: () => void }) => {
        setTitle(data.title)
        onConfirmRef.current = data.onConfirm
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

    const handleConfirm = useCallback(() => {
      onConfirmRef.current?.()
      bottomSheetRef.current?.dismiss()
    }, [])

    return (
      <BottomSheetModal
        ref={bottomSheetRef}
        snapPoints={snapPoints}
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
          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Buttons */}
          <View style={styles.buttonColumn}>
            <Pressable
              style={[styles.button, styles.deleteBtn]}
              onPress={handleConfirm}
            >
              <Text style={styles.deleteBtnText}>Supprimer</Text>
            </Pressable>

            <Pressable
              style={[styles.button, styles.cancelBtn, { backgroundColor: theme.secondary }]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

export default ConfirmDeleteSheet

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing['2xl'],
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
    textAlign: 'center',
  },
  buttonColumn: {
    flexDirection: 'column',
    gap: spacing.md,
    marginTop: spacing['2xl'],
    width: '100%',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    backgroundColor: colors.destructive,
  },
  deleteBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.destructiveForeground,
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
})
