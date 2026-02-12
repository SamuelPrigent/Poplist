import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Film } from 'lucide-react-native';
import { colors, spacing, fontSize } from '../constants/theme';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

export default function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {icon ?? <Film size={48} color={colors.mutedForeground} strokeWidth={1.5} />}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: fontSize.base,
    fontWeight: 'bold',
    color: colors.foreground,
    textAlign: 'center',
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    textAlign: 'center',
  },
});
