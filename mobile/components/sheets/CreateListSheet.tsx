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
import { mutate } from 'swr'
import { watchlistAPI } from '../../lib/api-client'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { Watchlist } from '../../types'

export interface CreateListSheetRef {
  present: () => void
  dismiss: () => void
}

const CreateListSheet = forwardRef<CreateListSheetRef>(function CreateListSheet(
  _props,
  ref,
) {
  const theme = useTheme()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheetModal>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset form state when opening
      setName('')
      setDescription('')
      setIsPublic(false)
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

  const handleCreate = useCallback(async () => {
    const trimmedName = name.trim()
    if (!trimmedName || isSubmitting) return

    setIsSubmitting(true)

    // Build optimistic watchlist
    const optimisticWatchlist: Watchlist = {
      id: `temp-${Date.now()}`,
      ownerId: '',
      name: trimmedName,
      description: description.trim() || undefined,
      isPublic,
      genres: [],
      collaborators: [],
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isOwner: true,
    }

    // Optimistic update
    await mutate(
      '/watchlists/mine',
      (current: { watchlists: Watchlist[] } | undefined) => {
        const existing = current?.watchlists ?? []
        return { watchlists: [optimisticWatchlist, ...existing] }
      },
      false,
    )

    try {
      await watchlistAPI.create({
        name: trimmedName,
        description: description.trim() || undefined,
        isPublic,
      })

      // Revalidate with server data
      await mutate('/watchlists/mine')

      Toast.show({ type: 'success', text1: 'Liste créée avec succès' })
      bottomSheetRef.current?.dismiss()
    } catch (error) {
      // Rollback on error
      await mutate('/watchlists/mine')
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de la création',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [name, description, isPublic, isSubmitting])

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
        {/* Title */}
        <Text style={styles.title}>Nouvelle liste</Text>

        {/* Name field */}
        <Text style={styles.label}>Nom</Text>
        <BottomSheetTextInput
          style={[styles.textInput, { backgroundColor: theme.input, color: colors.foreground }]}
          placeholder="Nom de la liste"
          placeholderTextColor={colors.mutedForeground}
          value={name}
          onChangeText={setName}
          autoCapitalize="sentences"
          maxLength={100}
        />

        {/* Description field */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>
          Description (optionnel)
        </Text>
        <BottomSheetTextInput
          style={[
            styles.textInput,
            styles.textArea,
            { backgroundColor: theme.input, color: colors.foreground },
          ]}
          placeholder="Décrivez votre liste..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />

        {/* Public/Private toggle */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>Visibilité</Text>
        <View style={styles.toggleRow}>
          <Pressable
            style={[
              styles.toggleBtn,
              { backgroundColor: theme.secondary },
              !isPublic && styles.toggleBtnActive,
            ]}
            onPress={() => setIsPublic(false)}
          >
            <Text
              style={[
                styles.toggleText,
                !isPublic && styles.toggleTextActive,
              ]}
            >
              Privée
            </Text>
          </Pressable>
          <Pressable
            style={[
              styles.toggleBtn,
              { backgroundColor: theme.secondary },
              isPublic && styles.toggleBtnActive,
            ]}
            onPress={() => setIsPublic(true)}
          >
            <Text
              style={[
                styles.toggleText,
                isPublic && styles.toggleTextActive,
              ]}
            >
              Publique
            </Text>
          </Pressable>
        </View>

        {/* Create button */}
        <Pressable
          style={[
            styles.createBtn,
            (!name.trim() || isSubmitting) && styles.createBtnDisabled,
          ]}
          onPress={handleCreate}
          disabled={!name.trim() || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.primaryForeground} />
          ) : (
            <Text style={styles.createBtnText}>Créer</Text>
          )}
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
})

export default CreateListSheet

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
  textArea: {
    minHeight: 80,
    paddingTop: spacing.md,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  toggleText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  toggleTextActive: {
    color: colors.primaryForeground,
  },
  createBtn: {
    marginTop: spacing['2xl'],
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnDisabled: {
    opacity: 0.5,
  },
  createBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: colors.primaryForeground,
  },
})
