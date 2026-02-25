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
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { useAuth } from '../../context/auth-context'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

const CONFIRMATION_WORD = 'SUPPRIMER'

export interface DeleteAccountSheetRef {
  present: () => void
  dismiss: () => void
}

const DeleteAccountSheet = forwardRef<DeleteAccountSheetRef>(function DeleteAccountSheet(
  _props,
  ref,
) {
  const theme = useTheme()
  const { deleteAccount } = useAuth()
  const router = useRouter()
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const snapPoints = ['80%']

  const [confirmation, setConfirmation] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const isConfirmed = confirmation.trim() === CONFIRMATION_WORD

  useImperativeHandle(ref, () => ({
    present: () => {
      setConfirmation('')
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

  const handleDelete = useCallback(async () => {
    if (!isConfirmed || isDeleting) return

    setIsDeleting(true)
    try {
      await deleteAccount(CONFIRMATION_WORD)
      bottomSheetRef.current?.dismiss()
      router.replace('/login')
    } catch {
      setIsDeleting(false)
    }
  }, [isConfirmed, isDeleting, deleteAccount, router])

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={styles.container}>
        <Text style={styles.title}>Supprimer mon compte</Text>

        <Text style={styles.warning}>
          Cette action est irréversible. Toutes vos listes, données et informations personnelles seront définitivement supprimées.
        </Text>

        <Text style={styles.label}>
          Tapez <Text style={styles.confirmWord}>{CONFIRMATION_WORD}</Text> pour confirmer
        </Text>
        <BottomSheetTextInput
          style={[styles.textInput, { backgroundColor: theme.input, color: colors.foreground }]}
          placeholder={CONFIRMATION_WORD}
          placeholderTextColor={colors.mutedForeground}
          value={confirmation}
          onChangeText={setConfirmation}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
        />

        <View style={styles.buttonRow}>
          <Pressable
            style={[styles.button, styles.cancelBtn, { backgroundColor: theme.secondary }]}
            onPress={() => bottomSheetRef.current?.dismiss()}
            disabled={isDeleting}
          >
            <Text style={styles.cancelBtnText}>Annuler</Text>
          </Pressable>

          <Pressable
            style={[
              styles.button,
              styles.deleteBtn,
              (!isConfirmed || isDeleting) && styles.deleteBtnDisabled,
            ]}
            onPress={handleDelete}
            disabled={!isConfirmed || isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color={colors.destructiveForeground} />
            ) : (
              <Text style={styles.deleteBtnText}>Supprimer mon compte</Text>
            )}
          </Pressable>
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

export default DeleteAccountSheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.destructive,
    marginBottom: spacing.md,
  },
  warning: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  confirmWord: {
    fontWeight: '800',
    color: colors.destructive,
  },
  textInput: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing['2xl'],
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
    opacity: 0.4,
  },
  deleteBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.destructiveForeground,
  },
})
