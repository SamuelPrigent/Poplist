import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react'
import { View, Text, Pressable, StyleSheet, ActivityIndicator, FlatList } from 'react-native'
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { User, X, Plus, Check } from 'lucide-react-native'
import Toast from 'react-native-toast-message'
import { mutate } from 'swr'
import { watchlistAPI, userAPI } from '../../lib/api-client'
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme'
import { useTheme } from '../../hooks/useTheme'
import type { Collaborator } from '../../types'

interface CollaboratorSheetData {
  id: string
  collaborators: Collaborator[]
}

export interface CollaboratorSheetRef {
  present: (data: CollaboratorSheetData) => void
  dismiss: () => void
}

interface CollaboratorSheetProps {
  onCollaboratorsChanged?: (collaborators: Collaborator[]) => void
}

const CollaboratorSheet = forwardRef<CollaboratorSheetRef, CollaboratorSheetProps>(
  function CollaboratorSheet({ onCollaboratorsChanged }, ref) {
    const theme = useTheme()
    const bottomSheetRef = useRef<BottomSheetModal>(null)
    const snapPoints = ['85%']

    const [watchlistId, setWatchlistId] = useState<string | null>(null)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [username, setUsername] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [removingId, setRemovingId] = useState<string | null>(null)
    const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>('idle')
    const debounceRef = useRef<NodeJS.Timeout | null>(null)

    useImperativeHandle(ref, () => ({
      present: (data: CollaboratorSheetData) => {
        setWatchlistId(data.id)
        setCollaborators(data.collaborators)
        setUsername('')
        setIsAdding(false)
        setRemovingId(null)
        bottomSheetRef.current?.present()
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }))

    useEffect(() => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
      setUsernameStatus('idle')

      if (username.trim().length >= 2) {
        debounceRef.current = setTimeout(async () => {
          setUsernameStatus('checking')
          try {
            await userAPI.getUserProfileByUsername(username.trim())
            setUsernameStatus('found')
          } catch {
            setUsernameStatus('not_found')
          }
        }, 300)
      }

      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current)
        }
      }
    }, [username])

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

    const handleAdd = useCallback(async () => {
      const trimmed = username.trim()
      if (!trimmed || !watchlistId || isAdding) return

      setIsAdding(true)

      try {
        const { collaborators: updated } = await watchlistAPI.addCollaborator(watchlistId, trimmed)
        setCollaborators(updated)
        setUsername('')
        if (onCollaboratorsChanged) onCollaboratorsChanged(updated)

        await mutate(`/watchlists/${watchlistId}`)
        Toast.show({ type: 'success', text1: 'Collaborateur ajouté' })
      } catch (error) {
        Toast.show({
          type: 'error',
          text1: error instanceof Error ? error.message : 'Erreur lors de l\'ajout',
        })
      } finally {
        setIsAdding(false)
      }
    }, [username, watchlistId, isAdding, onCollaboratorsChanged])

    const handleRemove = useCallback(async (collaboratorId: string) => {
      if (!watchlistId || removingId) return

      setRemovingId(collaboratorId)

      // Optimistic removal
      const previous = collaborators
      const updated = collaborators.filter((c) => c.id !== collaboratorId)
      setCollaborators(updated)

      try {
        const { collaborators: serverUpdated } = await watchlistAPI.removeCollaborator(watchlistId, collaboratorId)
        setCollaborators(serverUpdated)
        if (onCollaboratorsChanged) onCollaboratorsChanged(serverUpdated)

        await mutate(`/watchlists/${watchlistId}`)
        Toast.show({ type: 'success', text1: 'Collaborateur retiré' })
      } catch (error) {
        // Rollback
        setCollaborators(previous)
        Toast.show({
          type: 'error',
          text1: error instanceof Error ? error.message : 'Erreur lors de la suppression',
        })
      } finally {
        setRemovingId(null)
      }
    }, [watchlistId, collaborators, removingId, onCollaboratorsChanged])

    const renderCollaborator = useCallback(({ item }: { item: Collaborator }) => (
      <View style={[styles.collaboratorRow, { backgroundColor: theme.secondary }]}>
        {item.avatarUrl ? (
          <Image
            source={{ uri: item.avatarUrl }}
            style={styles.avatar}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.muted }]}>
            <User size={16} color={colors.mutedForeground} />
          </View>
        )}
        <Text style={styles.collaboratorName} numberOfLines={1}>
          {item.username}
        </Text>
        <Pressable
          style={styles.removeBtn}
          onPress={() => handleRemove(item.id)}
          disabled={removingId === item.id}
          hitSlop={8}
        >
          {removingId === item.id ? (
            <ActivityIndicator size="small" color={colors.mutedForeground} />
          ) : (
            <X size={18} color={colors.mutedForeground} />
          )}
        </Pressable>
      </View>
    ), [theme, handleRemove, removingId])

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
          {/* Title */}
          <Text style={styles.title}>Collaborateurs</Text>

          {/* Add input */}
          <View style={styles.addRow}>
            <View style={styles.inputWrapper}>
              <BottomSheetTextInput
                style={[styles.textInput, { backgroundColor: theme.input, color: colors.foreground }]}
                placeholder="Nom d'utilisateur"
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={50}
                onSubmitEditing={handleAdd}
                returnKeyType="done"
                autoFocus
              />
              {usernameStatus === 'checking' && (
                <View style={styles.inputStatusIcon}>
                  <ActivityIndicator size="small" color={colors.mutedForeground} />
                </View>
              )}
              {usernameStatus === 'found' && (
                <View style={styles.inputStatusIcon}>
                  <Check size={18} color="#22c55e" />
                </View>
              )}
              {usernameStatus === 'not_found' && (
                <View style={styles.inputStatusIcon}>
                  <X size={18} color="#ef4444" />
                </View>
              )}
            </View>
            <Pressable
              style={[
                styles.addBtn,
                (usernameStatus !== 'found' || isAdding) && styles.addBtnDisabled,
              ]}
              onPress={handleAdd}
              disabled={usernameStatus !== 'found' || isAdding}
            >
              {isAdding ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Plus size={20} color={colors.primaryForeground} />
              )}
            </Pressable>
          </View>

          {/* Collaborator list */}
          {collaborators.length === 0 ? (
            <Text style={styles.emptyText}>Aucun collaborateur</Text>
          ) : (
            <FlatList
              data={collaborators}
              keyExtractor={(item) => item.id}
              renderItem={renderCollaborator}
              contentContainerStyle={styles.listContent}
              style={styles.list}
            />
          )}
        </BottomSheetView>
      </BottomSheetModal>
    )
  },
)

export default CollaboratorSheet

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
    marginBottom: spacing.lg,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    paddingRight: 40,
    fontSize: fontSize.base,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputStatusIcon: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  emptyText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
  },
  collaboratorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collaboratorName: {
    flex: 1,
    fontSize: fontSize.base,
    fontWeight: '500',
    color: colors.foreground,
  },
  removeBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
