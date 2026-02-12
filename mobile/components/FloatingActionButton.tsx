import React from 'react'
import { View, Pressable, StyleSheet } from 'react-native'
import { spacing } from '../constants/theme'

interface FloatingActionButtonProps {
  icon: React.ReactNode
  onPress: () => void
  handedness: 'left' | 'right'
  secondaryIcon?: React.ReactNode
  showSecondary?: boolean
  onSecondaryPress?: () => void
}

export default function FloatingActionButton({
  icon,
  onPress,
  handedness,
  secondaryIcon,
  showSecondary = false,
  onSecondaryPress,
}: FloatingActionButtonProps) {
  return (
    <View
      style={[
        styles.container,
        handedness === 'left'
          ? { left: spacing.lg, flexDirection: 'row-reverse' }
          : { right: spacing.lg, flexDirection: 'row' },
      ]}
    >
      {showSecondary && secondaryIcon && onSecondaryPress && (
        <Pressable style={styles.fab} onPress={onSecondaryPress}>
          {secondaryIcon}
        </Pressable>
      )}
      <Pressable style={styles.fab} onPress={onPress}>
        {icon}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing['4xl'],
    alignItems: 'center',
    gap: spacing.sm,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a2540',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
})
