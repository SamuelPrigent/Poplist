import React, { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetTextInput,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
import { AlertTriangle } from 'lucide-react-native';
import { useLanguageStore } from '../../store/language';
import { useAuth } from '../../context/auth-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';

/**
 * Mot exigé par le backend : `confirmation: z.literal('confirmer')`
 * (`backend/src/validators/auth.validator.ts`). Le mobile envoyait
 * « SUPPRIMER » — la suppression échouait donc systématiquement à la
 * validation, alors que le libellé affiché demandait déjà « confirmer ».
 */
const CONFIRMATION_WORD = 'confirmer';

export interface DeleteAccountSheetRef {
  present: () => void;
  dismiss: () => void;
}

const DeleteAccountSheet = forwardRef<DeleteAccountSheetRef>(
  function DeleteAccountSheet(_props, ref) {
    const theme = useTheme();
    const { content } = useLanguageStore();
    const insets = useSafeAreaInsets();
    const { deleteAccount } = useAuth();
    const router = useRouter();
    const bottomSheetRef = useRef<BottomSheetModal>(null);

    const [confirmation, setConfirmation] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);

    const isConfirmed = confirmation.trim() === CONFIRMATION_WORD;

    useImperativeHandle(ref, () => ({
      present: () => {
        setConfirmation('');
        setIsDeleting(false);
        bottomSheetRef.current?.present();
      },
      dismiss: () => bottomSheetRef.current?.dismiss(),
    }));

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
      []
    );

    const handleDelete = useCallback(async () => {
      if (!isConfirmed || isDeleting) return;

      setIsDeleting(true);
      try {
        await deleteAccount(CONFIRMATION_WORD);
        bottomSheetRef.current?.dismiss();
        router.replace('/login');
      } catch {
        setIsDeleting(false);
      }
    }, [isConfirmed, isDeleting, deleteAccount, router]);

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
        <BottomSheetScrollView
          style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]}
        >
          {/* En-tête : rond d'alerte + titre rouge (PWA : ConfirmDialog) */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <AlertTriangle size={20} color="#ef4444" />
            </View>
            <Text style={styles.title}>{content.profile.deleteSection.dialogTitle}</Text>
          </View>

          <Text style={styles.warning}>{content.profile.deleteSection.dialogDescription}</Text>

          <Text style={styles.label}>{content.profile.deleteSection.confirmationLabel}</Text>
          <BottomSheetTextInput
            style={styles.textInput}
            placeholder=""
            placeholderTextColor={colors.mutedForeground}
            value={confirmation}
            onChangeText={setConfirmation}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />

          {/* Boutons EMPILÉS (PWA mobile) : Annuler en outline, puis l'action
              destructive, désactivée tant que le mot n'est pas saisi. */}
          <View style={styles.buttonColumn}>
            <Pressable
              style={[styles.button, styles.cancelBtn]}
              onPress={() => bottomSheetRef.current?.dismiss()}
              disabled={isDeleting}
            >
              <Text style={styles.cancelBtnText}>{content.profile.deleteSection.cancel}</Text>
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
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.deleteBtnText}>
                  {content.profile.deleteSection.deleteButton}
                </Text>
              )}
            </Pressable>
          </View>
        </BottomSheetScrollView>
      </BottomSheetModal>
    );
  }
);

export default DeleteAccountSheet;

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
    marginBottom: spacing.md,
  },
  warning: {
    fontSize: fontSize.sm,
    color: '#a1a1aa',
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
    color: '#e31d1d',
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  iconCircle: {
    // PWA : h-10 w-10 rounded-full bg-red-500/10
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  buttonColumn: {
    gap: spacing.sm,
    marginTop: spacing.lg,
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
    backgroundColor: '#dc2626',
  },
  deleteBtnDisabled: {
    opacity: 0.4,
  },
  deleteBtnText: {
    fontSize: fontSize.base,
    fontWeight: '700',
    color: '#fff',
  },
});
