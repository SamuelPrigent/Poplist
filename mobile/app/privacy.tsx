import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors, spacing, fontSize, fontWeight } from '../constants/theme'
import { useTheme } from '../hooks/useTheme'
import { useLanguageStore } from '../store/language'
// Index déjà présent dans le repo : les 6 langues y sont référencées.
import { privacyContent } from '../lib/content/privacy'
import { privacyFr } from '../lib/content/privacy/fr'

/** Puce d'énumération (les listes du texte légal). */
function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={styles.bulletDot}>•</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  )
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.paragraph}>{body}</Text>
    </View>
  )
}

/**
 * Politique de confidentialité — le contenu existait déjà dans
 * `lib/content/privacy/` mais n'était affiché nulle part. Accessible depuis le
 * menu de la bulle d'avatar, comme sur la PWA.
 */
export default function PrivacyScreen() {
  const theme = useTheme()
  const { language } = useLanguageStore()
  const t = privacyContent[language] ?? privacyFr

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['bottom']}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t.title}</Text>
        <Text style={styles.effective}>{t.effective}</Text>
        <Text style={styles.paragraph}>{t.intro}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.collectTitle}</Text>
          <Text style={styles.paragraph}>{t.collectIntro}</Text>
          <View style={styles.bullets}>
            <Bullet>{t.collectEmail}</Bullet>
            <Bullet>{t.collectUsername}</Bullet>
            <Bullet>{t.collectAvatar}</Bullet>
            <Bullet>{t.collectLists}</Bullet>
          </View>
          <Text style={styles.paragraph}>{t.collectNoTracking}</Text>
        </View>

        <Section title={t.useTitle} body={t.useDescription} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t.thirdPartyTitle}</Text>
          <Text style={styles.paragraph}>{t.thirdPartyIntro}</Text>
          <View style={styles.bullets}>
            <Bullet>{t.thirdPartyExpo}</Bullet>
            <Bullet>{t.thirdPartyGoogle}</Bullet>
            <Bullet>{t.thirdPartyCloudinary}</Bullet>
            <Bullet>{t.thirdPartyTMDB}</Bullet>
          </View>
        </View>

        <Section title={t.storageTitle} body={t.storageDescription} />
        <Section title={t.deletionTitle} body={t.deletionDescription} />
        <Section title={t.childrenTitle} body={t.childrenDescription} />
        <Section title={t.changesTitle} body={t.changesDescription} />
        <Section title={t.contactTitle} body={t.contactDescription} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['3xl'],
  },
  title: {
    fontSize: fontSize.pageTitle,
    fontWeight: fontWeight.bold,
    color: colors.foreground,
  },
  effective: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    color: colors.foreground,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.mutedForeground,
  },
  bullets: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    gap: 6,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  bulletDot: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.mutedForeground,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.mutedForeground,
  },
})
