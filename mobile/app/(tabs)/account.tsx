import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/auth-context';
import { userAPI } from '../../lib/api-client';
import { useLanguageStore } from '../../store/language';
import { WEB_APP_URL, BUY_ME_A_COFFEE_URL } from '../../constants/api';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import {
  LogOut,
  User as UserIcon,
  ChevronDown,
  Trash2,
  Camera,
  Upload,
  List,
  Shield,
  Coffee,
  ExternalLink,
} from 'lucide-react-native';
import type { Language } from '../../store/language';
import DeleteAccountSheet, {
  type DeleteAccountSheetRef,
} from '../../components/sheets/DeleteAccountSheet';

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
] as const;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/** Mini phone mockup showing a grid layout */
/**
 * Paramètres du profil — la déconnexion et les liens (Privacy, Buy me a
 * coffee) sont désormais dans le menu de la bulle d'avatar (UserMenuSheet),
 * comme sur la PWA. Cette page ne garde que : personnalisation du profil
 * (bento), langue, suppression du compte.
 */
export default function AccountScreen() {
  const { user, logout, refetch, updateUsername } = useAuth();
  const { content, language, setLanguage } = useLanguageStore();
  const theme = useTheme();
  const router = useRouter();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  // Inline username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Sheet refs
  const deleteAccountRef = useRef<DeleteAccountSheetRef>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleUsernameConfirm = async () => {
    const trimmed = editedUsername.trim();
    if (!trimmed || isSavingUsername) return;
    if (trimmed === user?.username) {
      setIsEditingUsername(false);
      return;
    }
    setIsSavingUsername(true);
    try {
      await updateUsername(trimmed);
      Toast.show({ type: 'success', text1: "Nom d'utilisateur mis à jour" });
      setIsEditingUsername(false);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
      });
    } finally {
      setIsSavingUsername(false);
    }
  };

  // Avatar: pick image from library and upload
  const handleAvatarPress = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          "L'acces a la galerie est necessaire pour changer votre photo."
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (result.canceled || !result.assets[0]?.base64) return;

      const base64 = result.assets[0].base64;
      const mimeType = result.assets[0].mimeType || 'image/jpeg';
      const imageData = `data:${mimeType};base64,${base64}`;

      await userAPI.uploadAvatar(imageData);
      await refetch();
      Toast.show({ type: 'success', text1: 'Photo de profil mise a jour' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: error instanceof Error ? error.message : 'Erreur lors du changement de photo',
      });
    }
  }, [refetch]);

  // Avatar: long press menu
  const handleAvatarLongPress = useCallback(() => {
    Alert.alert('Photo de profil', undefined, [
      { text: 'Changer la photo', onPress: handleAvatarPress },
      {
        text: 'Supprimer la photo',
        style: 'destructive',
        onPress: async () => {
          try {
            await userAPI.deleteAvatar();
            await refetch();
            Toast.show({ type: 'success', text1: 'Photo de profil supprimee' });
          } catch (error) {
            Toast.show({
              type: 'error',
              text1: error instanceof Error ? error.message : 'Erreur lors de la suppression',
            });
          }
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }, [handleAvatarPress, refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Copie de la maquette PWA (`frontend/src/app/account/page.tsx`) :
          titre + sous-titre, puis une CARTE par section (photo, pseudo, langue,
          suppression). UN SEUL ScrollView : deux zones scrollables imbriquées
          coupaient le contenu. */}
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Paramètres du profil</Text>
        <Text style={styles.pageSubtitle}>
          Gérez les paramètres et préférences de votre compte
        </Text>

        {/* Carte : photo de profil */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Photo de profil</Text>
          <Text style={styles.cardDescription}>
            Téléchargez une photo de profil pour personnaliser votre compte
          </Text>

          <View style={styles.avatarBlock}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarLarge}
                contentFit="cover"
                recyclingKey="account-avatar"
                transition={0}
              />
            ) : (
              <View style={[styles.avatarLarge, styles.avatarPlaceholder]}>
                <UserIcon size={48} color={colors.mutedForeground} />
              </View>
            )}

            <View style={styles.avatarActions}>
              <Pressable style={styles.outlineButton} onPress={handleAvatarPress}>
                <Upload size={16} color={colors.foreground} />
                <Text style={styles.outlineButtonText}>Modifier</Text>
              </Pressable>
              {user?.avatarUrl ? (
                <Pressable style={styles.outlineButton} onPress={handleAvatarLongPress}>
                  <Trash2 size={16} color={colors.foreground} />
                  <Text style={styles.outlineButtonText}>Supprimer</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <Text style={styles.cardHint}>Recommandé : Image carrée, 5 Mo maximum</Text>
        </View>

        {/* Carte : nom d'utilisateur */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Nom d'utilisateur
          </Text>
          <View
            style={[
              styles.usernameRow,
              { backgroundColor: theme.container, borderColor: theme.border },
            ]}
          >
            <TextInput
              style={[
                styles.usernameInput,
                { color: isEditingUsername ? colors.foreground : colors.mutedForeground },
              ]}
              value={editedUsername}
              onChangeText={setEditedUsername}
              editable={isEditingUsername}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={30}
            />
            <Pressable
              style={[styles.usernameBtn, isEditingUsername && styles.usernameBtnConfirm]}
              onPress={() => {
                if (isEditingUsername) {
                  handleUsernameConfirm();
                } else {
                  setEditedUsername(user?.username || '');
                  setIsEditingUsername(true);
                }
              }}
              disabled={isSavingUsername}
            >
              {isSavingUsername ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Text
                  style={[
                    styles.usernameBtnText,
                    isEditingUsername && styles.usernameBtnTextConfirm,
                  ]}
                >
                  {isEditingUsername ? 'Confirmer' : 'Modifier'}
                </Text>
              )}
            </Pressable>
          </View>


          {/* Langue */}
        </View>

        {/* Carte : langue (absente de la PWA, qui la met dans son header) */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Langue</Text>
          <View style={{ zIndex: 10 }}>
            <Pressable
              style={[
                styles.dropdownTrigger,
                { backgroundColor: theme.container, borderColor: theme.border },
              ]}
              onPress={() => setLangDropdownOpen(true)}
            >
              <Text style={styles.dropdownFlag}>{currentLang.flag}</Text>
              <Text style={styles.dropdownLabel}>{currentLang.label}</Text>
              <ChevronDown size={16} color={colors.mutedForeground} />
            </Pressable>

            <Modal
              visible={langDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setLangDropdownOpen(false)}
            >
              <Pressable style={styles.dropdownOverlay} onPress={() => setLangDropdownOpen(false)}>
                <View
                  style={[
                    styles.dropdownMenu,
                    { backgroundColor: theme.panel, borderColor: theme.border },
                  ]}
                >
                  {LANGUAGES.map(lang => {
                    const isActive = language === lang.code;
                    return (
                      <Pressable
                        key={lang.code}
                        style={[styles.dropdownItem, isActive && { backgroundColor: theme.accent }]}
                        onPress={() => {
                          setLanguage(lang.code as Language);
                          setLangDropdownOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.dropdownItemText,
                            isActive && styles.dropdownItemTextActive,
                          ]}
                        >
                          {lang.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </Pressable>
            </Modal>
          </View>
        </View>

        {/* Carte : suppression du compte (bordure rouge, comme la PWA) */}
        <View style={[styles.card, styles.cardDanger]}>
          <Text style={styles.cardTitleDanger}>Supprimer le compte</Text>
          <Text style={styles.cardDescription}>{content.profile.deleteSection.description}</Text>
          <Pressable
            style={styles.destructiveButton}
            onPress={() => deleteAccountRef.current?.present()}
          >
            <Text style={styles.destructiveButtonText}>Supprimer le compte</Text>
          </Pressable>
        </View>
      </ScrollView>


      {/* Bottom sheets */}
      <DeleteAccountSheet ref={deleteAccountRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  /** Carte de section — PWA : <Card> bordée, fond `card`, padding 24. */
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  cardDanger: {
    borderColor: 'rgba(239, 68, 68, 0.5)',
  },
  cardTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
  },
  cardTitleDanger: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: '#ef4444',
  },
  cardDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
  },
  cardHint: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: spacing.md,
  },
  pageSubtitle: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  /** Bloc avatar : image 96 + actions (PWA : colonne en mobile). */
  avatarBlock: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  outlineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.button,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlineButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '500',
    color: colors.foreground,
  },
  destructiveButton: {
    height: 36,
    alignSelf: 'flex-start',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.button,
    backgroundColor: '#7f1d1d',
    marginTop: spacing.lg,
  },
  destructiveButtonText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: '#fef2f2',
  },
  pageTitle: {
    fontSize: fontSize.pageTitle,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: spacing.xl,
  },
  /** Bloc « bento » de personnalisation du profil (PWA). */
  bento: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    marginBottom: spacing['2xl'],
  },
  bentoAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bentoAvatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  bentoInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
  },
  pageContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  // Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.foreground,
  },
  email: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.foreground,
  },
  tabText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    fontWeight: '500',
  },
  tabTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  // Language
  sectionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.foreground,
    marginBottom: spacing.md,
  },
  sectionHint: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignSelf: 'flex-start',
  },
  dropdownFlag: {
    fontSize: 18,
  },
  dropdownLabel: {
    fontSize: fontSize.sm,
    color: colors.foreground,
    fontWeight: '500',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownMenu: {
    width: 220,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  dropdownItemActive: {
    backgroundColor: colors.accent,
  },
  dropdownItemText: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
  },
  dropdownItemTextActive: {
    color: colors.foreground,
    fontWeight: '600',
  },
  // Columns
  columnLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  columnLabelActive: {
    color: colors.primary,
  },
  // Avatar badge
  avatarBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  // Action rows
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  actionRowContent: {
    flex: 1,
  },
  actionRowLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  actionRowValue: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  // Inline username
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  usernameInput: {
    flex: 1,
    fontSize: fontSize.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  usernameBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.muted,
  },
  usernameBtnConfirm: {
    backgroundColor: colors.primary,
  },
  usernameBtnText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  usernameBtnTextConfirm: {
    color: colors.primaryForeground,
  },
  // Danger zone
  dangerSection: {
    marginTop: spacing['3xl'],
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  dangerTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.destructive,
    marginBottom: spacing.xs,
  },
  dangerDesc: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginBottom: spacing.lg,
  },
});
