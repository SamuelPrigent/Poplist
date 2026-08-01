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
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Toast from 'react-native-toast-message'
import { mutate } from '../../hooks/queries'
import { watchlistAPI } from '../../lib/api-client'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { Watchlist } from '../../types'
import { GENRE_CATEGORIES, getCategoryInfo, type GenreCategory } from '../../types/categories'
import { useLanguageStore } from '../../store/language'

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
  const { content } = useLanguageStore()
  const bottomSheetRef = useRef<BottomSheetModal>(null)
  const nameRef = useRef<any>(null)
  const descRef = useRef<any>(null)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [genreCategories, setGenreCategories] = useState<GenreCategory[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  useImperativeHandle(ref, () => ({
    present: () => {
      // Reset form state when opening
      setName('')
      setDescription('')
      setGenreCategories([])
      setIsSubmitting(false)
      nameRef.current?.clear()
      descRef.current?.clear()
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
        opacity={0.8}
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
    const genresData = genreCategories.length > 0 ? [...genreCategories] : []
    const optimisticWatchlist: Watchlist = {
      id: `temp-${Date.now()}`,
      ownerId: '',
      name: trimmedName,
      description: description.trim() || null,
      imageUrl: null,
      thumbnailUrl: null,
      dominantColor: null,
      genres: genresData,
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
        genres: genresData.length > 0 ? genresData : undefined,
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
  }, [name, description, genreCategories, isSubmitting])

  return (
    <BottomSheetModal
      ref={bottomSheetRef}
      snapPoints={['85%']}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{
        backgroundColor: 'rgba(124, 135, 152, 0.4)',
        width: 44,
        height: 6,
        borderRadius: 999,
      }}
      backgroundStyle={{
        backgroundColor: colors.background,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
      }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
    >
      <BottomSheetScrollView style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}>
        {/* Title */}
        <Text style={styles.title}>Nouvelle liste</Text>

        {/* Name field */}
        <Text style={styles.label}>Nom <Text style={{ color: '#ef4444' }}>*</Text></Text>
        <BottomSheetTextInput
          ref={nameRef}
          style={[styles.textInput, { backgroundColor: theme.input, color: colors.foreground }]}
          placeholder="Nom de la liste"
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setName}
          autoCapitalize="sentences"
          maxLength={100}
          autoFocus
        />

        {/* Description field */}
        <Text style={[styles.label, { marginTop: spacing.lg }]}>Description</Text>
        <BottomSheetTextInput
          ref={descRef}
          style={[
            styles.textInput,
            styles.textArea,
            { backgroundColor: theme.input, color: colors.foreground },
          ]}
          placeholder="Décrivez votre liste..."
          placeholderTextColor={colors.mutedForeground}
          onChangeText={setDescription}
          multiline
          numberOfLines={3}
          maxLength={500}
          textAlignVertical="top"
        />

        {/* Catégories par genre (toujours proposées : plus de listes privées) */}
        <>
            <Text style={[styles.label, { marginTop: spacing.lg }]}>
              Catégories par genre
            </Text>
            <View style={styles.genreRow}>
              {GENRE_CATEGORIES.map((category) => {
                const isActive = genreCategories.includes(category)
                return (
                  <Pressable
                    key={category}
                    style={[
                      styles.genrePill,
                      { backgroundColor: theme.secondary },
                      isActive && styles.genrePillActive,
                    ]}
                    onPress={() =>
                      setGenreCategories((prev) =>
                        prev.includes(category)
                          ? prev.filter((c) => c !== category)
                          : [...prev, category],
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.genrePillText,
                        isActive && styles.genrePillTextActive,
                      ]}
                    >
                      {getCategoryInfo(category, content).name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
        </>

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
      </BottomSheetScrollView>
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
    // PWA : h-10 rounded-md px-3 py-2 text-sm
    height: 40,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: undefined,
    minHeight: 88,
    paddingTop: spacing.sm,
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
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  genrePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
  },
  genrePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genrePillText: {
    fontSize: fontSize.xs,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  genrePillTextActive: {
    color: colors.primaryForeground,
  },
  createBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    height: 36,
    borderRadius: borderRadius.xl,
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
