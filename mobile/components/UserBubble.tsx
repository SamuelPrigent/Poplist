import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';

interface UserBubbleProps {
  user: {
    username: string;
    avatarUrl?: string;
  };
  listCount: number;
  onPress: () => void;
}

export default function UserBubble({ user, listCount, onPress }: UserBubbleProps) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      {user.avatarUrl ? (
        <Image
          source={{ uri: user.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <User size={18} color={colors.mutedForeground} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.username} numberOfLines={1}>
          {user.username}
        </Text>
        <Text style={styles.listCount} numberOfLines={1}>
          {listCount} {listCount === 1 ? 'liste' : 'listes'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1729',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  username: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.foreground,
  },
  listCount: {
    fontSize: fontSize.xs,
    color: colors.mutedForeground,
  },
});
