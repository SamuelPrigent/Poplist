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
import { mutate } from 'swr'
import { watchlistAPI } from '../../lib/api-client'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { Watchlist } from '../../types'

interface EditListData {
  id: string
  name: string
  description?: string
  isPublic: boolean
}

export interface EditListSheetRef {
  present: (watchlist: EditListData) => void
  dismiss: () => void
}

interface EditListSheetProps {
  onUpdated?: (updated: Watchlist) => void
}

const EditListSheet = forwardRef<EditListSheetRef, EditListSheetProps>(
  function EditListSheet({ onUpdated }, ref) {
    const theme = useTheme()
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const snapPoints = ['92%']

    const [targetId, setTargetId] = useState<string | null>(null)
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [isPublic, setIsPublic] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    useImperativeHandle(ref, () => ({
      present: (watchlist: EditListData) => {
        setTargetId(watchlist.id)
        setName(watchlist.name)
        setDescription(watchlist.description ?? '')
        setIsPublic(watchlist.isPublic)
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

    const handleUpdate = useCallback(async () => {
      const trimmedName = name.trim()
      if (!trimmedName || !targetId || isSubmitting) return

      setIsSubmitting(true)

      try {
        const { watchlist } = await watchlistAPI.update(targetId, {
          name: trimmedName,
          description: description.trim() || undefined,
          isPublic,
        })

        // Revalidate caches
        await mutate(`/watchlists/${targetId}`)
        await mutate('/watchlists/mine')

        // Notify parent with fresh data
        if (onUpdated) onUpdated(watchlist)

        Toast.show({ type: 'success', text1: 'Liste mise à jour' })
        bottomSheetRef.current?.dismiss()
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        })
      } finally {
        setIsSubmitting(false)
      }
    }, [name, description, isPublic, targetId, isSubmitting, onUpdated])

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
        <BottomSheetScrollView style={styles.container}>
          {/* Title */}
          <Text style={styles.title}>Modifier la liste</Text>

          {/* Name field */}
          <Text style={styles.label}>Nom</Text>
          <BottomSheetTextInput
            style={[styles.textInput, { backgroundColor: theme.input, borderColor: theme.border, color: colors.foreground }]}
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
              { backgroundColor: theme.input, borderColor: theme.border, color: colors.foreground },
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

          {/* Save button */}
          <Pressable
            style={[
              styles.saveBtn,
              (!name.trim() || isSubmitting) && styles.saveBtnDisabled,
            ]}
            onPress={handleUpdate}
            disabled={!name.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={styles.saveBtnText}>Enregistrer</Text>
            )}
          </Pressable>
        </BottomSheetScrollView>
      </BottomSheetModal>
    )
  },
)

export default EditListSheet

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
