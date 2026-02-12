import { useState, useRef, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, ScrollView, TextInput, Dimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { useAuth } from '../../context/auth-context'
import { useLanguageStore } from '../../store/language'
import { usePreferencesStore, type ColumnCount, type Handedness } from '../../store/preferences'
import { colors, fontSize, spacing, borderRadius } from '../../constants/theme'
import { LogOut, User as UserIcon, Check } from 'lucide-react-native'
import type { Language } from '../../store/language'

const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
] as const

const { width: SCREEN_WIDTH } = Dimensions.get('window')

type TabKey = 'preferences' | 'account'
const TABS: TabKey[] = ['preferences', 'account']

/** Mini phone mockup showing a grid layout */
function PhoneMockup({ cols, isActive }: { cols: 2 | 3; isActive: boolean }) {
  const phoneW = 64
  const phoneH = 104
  const borderW = 2
  const innerPad = 5
  const notchH = 8 // notch height + marginTop
  const contentW = phoneW - borderW * 2 - innerPad * 2
  const gap = 3
  const cellW = Math.floor((contentW - gap * (cols - 1)) / cols)
  const cellH = Math.round(cellW * 1.4)
  const rows = 3

  return (
    <View
      style={[
        mockupStyles.phone,
        { width: phoneW, height: phoneH },
        isActive && mockupStyles.phoneActive,
      ]}
    >
      {/* Notch */}
      <View style={mockupStyles.notch} />
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
                  backgroundColor: isActive ? 'rgba(99,102,241,0.35)' : colors.secondary,
                }}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  )
}

const mockupStyles = StyleSheet.create({
  phone: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: '#0a1122',
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
    backgroundColor: colors.border,
    marginTop: 5,
  },
})

export default function AccountScreen() {
  const { user, logout } = useAuth()
  const { content, language, setLanguage } = useLanguageStore()
  const { columns, setColumns, handedness, setHandedness } = usePreferencesStore()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabKey>('preferences')
  const [usernameInput, setUsernameInput] = useState(user?.username || '')
  const scrollRef = useRef<ScrollView>(null)

  const handleTabPress = (tab: TabKey) => {
    setActiveTab(tab)
    scrollRef.current?.scrollTo({ x: TABS.indexOf(tab) * SCREEN_WIDTH, animated: true })
  }

  const handleScrollEnd = useCallback((e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
    setActiveTab(TABS[pageIndex])
  }, [])

  const handleLogout = async () => {
    await logout()
    router.replace('/login')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Fixed header + tabs */}
      <View style={styles.headerSection}>
        <View style={styles.headerRow}>
          <View style={styles.avatar}>
            {user?.avatarUrl ? (
              <Image
                source={{ uri: user.avatarUrl }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <UserIcon size={24} color={colors.mutedForeground} />
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.username} numberOfLines={1}>{user?.username || 'User'}</Text>
            <Text style={styles.email} numberOfLines={1}>{user?.email}</Text>
          </View>
          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <LogOut size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tab, activeTab === 'preferences' && styles.tabActive]}
            onPress={() => handleTabPress('preferences')}
          >
            <Text style={[styles.tabText, activeTab === 'preferences' && styles.tabTextActive]}>
              Préférences
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tab, activeTab === 'account' && styles.tabActive]}
            onPress={() => handleTabPress('account')}
          >
            <Text style={[styles.tabText, activeTab === 'account' && styles.tabTextActive]}>
              Compte
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Swipeable tab content */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
      >
        {/* Page: Préférences */}
        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{content.footer.language}</Text>
          <View style={styles.languageGrid}>
            {LANGUAGES.map((lang) => {
              const isActive = language === lang.code
              return (
                <Pressable
                  key={lang.code}
                  style={[styles.languageChip, isActive && styles.languageChipActive]}
                  onPress={() => setLanguage(lang.code as Language)}
                >
                  <Text style={[styles.languageText, isActive && styles.languageTextActive]}>
                    {lang.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing['2xl'] }]}>Affichage</Text>
          <Text style={styles.sectionHint}>Colonnes sur la page d'accueil</Text>
          <View style={styles.columnsRow}>
            {([2, 3] as const).map((col) => {
              const isActive = columns === col
              return (
                <Pressable
                  key={col}
                  style={styles.columnOption}
                  onPress={() => setColumns(col as ColumnCount)}
                >
                  <PhoneMockup cols={col} isActive={isActive} />
                  <Text
                    style={[
                      styles.columnLabel,
                      isActive && styles.columnLabelActive,
                    ]}
                  >
                    x{col}
                  </Text>
                </Pressable>
              )
            })}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: spacing['2xl'] }]}>Main dominante</Text>
          <Text style={styles.sectionHint}>Position des boutons d'action</Text>
          <View style={styles.handednessRow}>
            {([
              { key: 'left', label: 'Gaucher' },
              { key: 'right', label: 'Droitier' },
            ] as const).map(({ key, label }) => {
              const isActive = handedness === key
              return (
                <Pressable
                  key={key}
                  style={[styles.handednessChip, isActive && styles.handednessChipActive]}
                  onPress={() => setHandedness(key as Handedness)}
                >
                  <Text style={[styles.handednessText, isActive && styles.handednessTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>

        {/* Page: Compte */}
        <ScrollView
          style={{ width: SCREEN_WIDTH }}
          contentContainerStyle={styles.pageContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>{content.profile.usernameSection.title}</Text>
          <View style={styles.usernameRow}>
            <TextInput
              style={styles.usernameInput}
              value={usernameInput}
              onChangeText={setUsernameInput}
              placeholder={content.profile.usernameSection.placeholder}
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable style={styles.usernameOk} onPress={() => {/* Phase 1: non-functional */}}>
              <Check size={18} color={colors.primaryForeground} />
            </Pressable>
          </View>

          <View style={styles.dangerSection}>
            <Text style={styles.dangerTitle}>{content.profile.deleteSection.title}</Text>
            <Text style={styles.dangerDesc}>{content.profile.deleteSection.description}</Text>
            <Pressable style={styles.dangerBtn} onPress={() => {/* Phase 1: non-functional */}}>
              <Text style={styles.dangerBtnText}>{content.profile.deleteSection.deleteButton}</Text>
            </Pressable>
          </View>
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  )
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
    backgroundColor: '#0f1729',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Tabs
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.xl,
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
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  languageChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  languageChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  languageText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  languageTextActive: {
    color: colors.primaryForeground,
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
  // Handedness
  handednessRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  handednessChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handednessChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  handednessText: {
    fontSize: fontSize.sm,
    color: colors.foreground,
  },
  handednessTextActive: {
    color: colors.primaryForeground,
  },
  // Username
  usernameRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
  },
  usernameInput: {
    flex: 1,
    backgroundColor: colors.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.base,
    color: colors.foreground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usernameOk: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
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
  dangerBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignSelf: 'flex-start',
  },
  dangerBtnText: {
    fontSize: fontSize.sm,
    color: colors.destructive,
    fontWeight: '500',
  },
})
