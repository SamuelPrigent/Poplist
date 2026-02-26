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
import Toast from 'react-native-toast-message'
import { useAuth } from '../../context/auth-context'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'

export interface EditProfileSheetRef {
  present: () => void
  dismiss: () => void
}

const EditProfileSheet = forwardRef<EditProfileSheetRef>(function EditProfileSheet(
  _props,
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const { user, updateUsername } = useAuth()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [username, setUsername] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    present: () => {
      setUsername(user?.username || '')
      setIsSubmitting(false)
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

  const handleSave = useCallback(async () => {
    const trimmed = username.trim()
    if (!trimmed || isSubmitting) return
    if (trimmed === user?.username) {
      bottomSheetRef.current?.dismiss()
      return
    }

    setIsSubmitting(true)
    try {
      await updateUsername(trimmed)
      Toast.show({ type: 'success', text1: "Nom d'utilisateur mis à jour" })
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [username, isSubmitting, user?.username, updateUsername])

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
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetView style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        <Text style={styles.title}>Modifier le nom d'utilisateur</Text>

        <Text style={styles.label}>Nom d'utilisateur</Text>
        <BottomSheetTextInput
          style={[styles.textInput, { backgroundColor: theme.input, color: colors.foreground }]}
          placeholder="Nom d'utilisateur"
          placeholderTextColor={colors.mutedForeground}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={30}
          autoFocus
        />

        <Pressable
          style={[
            styles.saveBtn,
            (!username.trim() || isSubmitting) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!username.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.saveBtnText}>Sauvegarder</Text>
          )}
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

export default EditProfileSheet

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.sm,
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
  saveBtn: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
})
