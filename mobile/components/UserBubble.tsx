import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '../constants/theme';
import { useTheme } from '../hooks/useTheme';

interface UserBubbleProps {
  user: {
    username: string;
    avatarUrl?: string;
  };
  listCount: number;
  onPress: () => void;
  /**
   * `carousel` (défaut) : colonne centrée, avatar 60 — accueil.
   * `card` : carte horizontale pleine largeur, avatar 44 — page « Créateurs ».
   * Reprend les deux modes de `UserCard` côté PWA.
   */
  layout?: 'carousel' | 'card';
}

/**
 * Bulle créateur — portage PWA (§ 3.1) : avatar rond ~64px, pseudo puis
 * « N listes », le tout centré en colonne (pas de card de fond).
 */
export default function UserBubble({
  user,
  listCount,
  onPress,
  layout = 'carousel',
}: UserBubbleProps) {
  const theme = useTheme();
  const isCard = layout === 'card';
  return (
    <Pressable style={isCard ? styles.cardLayout : styles.card} onPress={onPress}>
      {user.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={isCard ? styles.avatarSmall : styles.avatar}
          contentFit="cover"
          recyclingKey={`bubble-${user.username}`}
          transition={0}
        />
      ) : (
        <View
          style={[
            isCard ? styles.avatarPlaceholderSmall : styles.avatarPlaceholder,
            { backgroundColor: theme.muted },
          ]}
        >
          <User size={18} color={colors.mutedForeground} />
        </View>
      )}
      <View style={isCard ? styles.infoCard : styles.info}>
        <Text style={[styles.username, isCard && styles.textLeft]} numberOfLines={1}>
          {user.username}
        </Text>
        <Text style={[styles.listCount, isCard && styles.textLeft]} numberOfLines={1}>
          {listCount} {listCount === 1 ? 'liste' : 'listes'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  /** PWA (UserCard non-carousel, mobile) : bg-muted/30 p-3 rounded-lg flex-row gap-3 */
  cardLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(27, 32, 41, 0.5)',
  },
  avatarSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholderSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    flex: 1,
    gap: 2,
  },
  textLeft: {
    textAlign: 'left',
  },
  avatar: {
    // 60 → 51 (-15 %) puis 51 → 54 (+5 %), après deux revues sur device.
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    alignItems: 'center',
    gap: 2,
  },
  username: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    textAlign: 'center',
  },
  listCount: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
