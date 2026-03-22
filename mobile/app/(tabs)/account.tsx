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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Toast from 'react-native-toast-message';
import { useAuth } from '../../context/auth-context';
import { userAPI } from '../../lib/api-client';
import { useLanguageStore } from '../../store/language';
import { usePreferencesStore, type ColumnCount } from '../../store/preferences';
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useTheme';
import { LogOut, User as UserIcon, ChevronDown, Trash2, Camera, List } from 'lucide-react-native';
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
function PhoneMockup({
  cols,
  isActive,
  theme,
}: {
  cols: number;
  isActive: boolean;
  theme: import('../../hooks/useTheme').ThemeColors;
}) {
  const phoneW = 64;
  const phoneH = 104;
  const borderW = 2;
  const innerPad = 5;
  const contentW = phoneW - borderW * 2 - innerPad * 2;
  const gap = 3;
  const cellW = Math.floor((contentW - gap * (cols - 1)) / cols);
  const cellH = Math.round(cellW * 1.4);
  const rows = 3;

  return (
    <View
      style={[
        mockupStyles.phone,
        { width: phoneW, height: phoneH, borderColor: theme.border, backgroundColor: theme.panel },
        isActive && mockupStyles.phoneActive,
      ]}
    >
      {/* Notch */}
      <View style={[mockupStyles.notch, { backgroundColor: theme.border }]} />
      {/* Grid */}
      <View style={{ paddingHorizontal: innerPad, paddingTop: 7, alignItems: 'center', gap }}>
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={{ flexDirection: 'row', gap }}>
            {Array.from({ length: cols }, (_, col) => (
              <View
                key={col}
                style={{
                  width: cellW,
                  height: cellH,
                  borderRadius: 3,
                  backgroundColor: isActive ? 'rgba(99,102,241,0.35)' : theme.secondary,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const mockupStyles = StyleSheet.create({
  phone: {
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  phoneActive: {
    borderColor: colors.primary,
  },
  notch: {
    alignSelf: 'center',
    width: 20,
    height: 3,
    borderRadius: 2,
    marginTop: 5,
  },
});

export default function AccountScreen() {
  const { user, logout, refetch, updateUsername } = useAuth();
  const { content, language, setLanguage } = useLanguageStore();
  const { columns, setColumns } = usePreferencesStore();
  const theme = useTheme();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'preferences' | 'account'>('preferences');
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Inline username editing
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [isSavingUsername, setIsSavingUsername] = useState(false);

  // Sheet refs
  const deleteAccountRef = useRef<DeleteAccountSheetRef>(null);

  const currentLang = LANGUAGES.find(l => l.code === language) || LANGUAGES[0];

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

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
      {/* Fixed header + tabs */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <Pressable
            style={[styles.avatar, { backgroundColor: theme.secondary }]}
            onPress={handleAvatarPress}
            onLongPress={handleAvatarLongPress}
          >
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
                recyclingKey="account-avatar"
                transition={0}
              />
            ) : (
              <UserIcon size={24} color={colors.mutedForeground} />
            )}
            <View style={styles.avatarBadge}>
              <Camera size={10} color={colors.foreground} />
            </View>
          </Pressable>
          <View style={styles.headerInfo}>
            <Text style={styles.username} numberOfLines={1}>
              {user?.username || 'User'}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
          <Pressable
            style={[styles.logoutBtn, { backgroundColor: theme.container }]}
            onPress={handleLogout}
          >
            <LogOut size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[styles.tabsRow, { borderBottomColor: theme.border }]}>
          {(['preferences', 'account'] as const).map(tab => {
            const label = tab === 'preferences' ? 'Préférences' : 'Compte';
            return (
              <Pressable
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => {
                  setActiveTab(tab);
                  scrollRef.current?.scrollTo({
                    x: tab === 'preferences' ? 0 : SCREEN_WIDTH,
                    animated: true,
                  });
                }}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={e => {
          const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setActiveTab(page === 0 ? 'preferences' : 'account');
        }}
        scrollEventThrottle={16}
      >
        {/* Page: Préférences */}
        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Affichage des listes */}
          <Text style={styles.sectionTitle}>Affichage des listes</Text>
          <View style={styles.columnsRow}>
            {([1, 3] as const).map(col => {
              const isActive = columns === col;
              return (
                <Pressable
                  key={col}
                  style={styles.columnOption}
                  onPress={() => setColumns(col as ColumnCount)}
                >
                  {col === 1 ? (
                    <View
                      style={[
                        mockupStyles.phone,
                        {
                          width: 64,
                          height: 104,
                          borderColor: theme.border,
                          backgroundColor: theme.panel,
                        },
                        isActive && mockupStyles.phoneActive,
                      ]}
                    >
                      <View style={[mockupStyles.notch, { backgroundColor: theme.border }]} />
                      <View style={{ paddingHorizontal: 5, paddingTop: 7, gap: 4 }}>
                        {[0, 1, 2].map(i => (
                          <View
                            key={i}
                            style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                          >
                            <View
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: 3,
                                backgroundColor: isActive
                                  ? 'rgba(99,102,241,0.35)'
                                  : theme.secondary,
                              }}
                            />
                            <View style={{ flex: 1, gap: 2 }}>
                              <View
                                style={{
                                  height: 3,
                                  width: '80%',
                                  borderRadius: 1,
                                  backgroundColor: isActive
                                    ? 'rgba(99,102,241,0.35)'
                                    : theme.secondary,
                                }}
                              />
                              <View
                                style={{
                                  height: 2,
                                  width: '50%',
                                  borderRadius: 1,
                                  backgroundColor: isActive
                                    ? 'rgba(99,102,241,0.2)'
                                    : theme.secondary,
                                }}
                              />
                            </View>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : (
                    <PhoneMockup cols={col} isActive={isActive} theme={theme} />
                  )}
                  <Text style={[styles.columnLabel, isActive && styles.columnLabelActive]}>
                    {col === 1 ? 'Liste' : `x${col}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Nom d'utilisateur */}
          <Text style={[styles.sectionTitle, { marginTop: spacing['3xl'] }]}>
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
          <Text style={[styles.sectionTitle, { marginTop: spacing['3xl'] }]}>Langue</Text>
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
        </ScrollView>

        {/* Page: Compte */}
        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Supprimer le compte
          </Text>
          <Text style={styles.dangerDesc}>{content.profile.deleteSection.description}</Text>
          <Pressable
            style={[
              styles.actionRow,
              { backgroundColor: theme.container, borderColor: theme.border },
            ]}
            onPress={() => deleteAccountRef.current?.present()}
          >
            <Trash2 size={18} color="#d52222" />
            <View style={styles.actionRowContent}>
              <Text style={[styles.actionRowLabel, { color: colors.foreground }]}>
                Supprimer le compte
              </Text>
            </View>
          </Pressable>
        </ScrollView>
      </ScrollView>

      {/* Bottom sheets */}
      <DeleteAccountSheet ref={deleteAccountRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: spacing.lg,
  },
  pageContent: {
    padding: spacing.lg,
    paddingBottom: spacing['4xl'],
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
  columnsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  columnOption: {
    alignItems: 'center',
    gap: spacing.sm,
  },
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
