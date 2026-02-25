import React from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated'
import { Bookmark } from 'lucide-react-native'

interface SaveButtonProps {
  isSaved: boolean
  onToggle: () => void
  size?: number
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export default function SaveButton({ isSaved, onToggle, size = 26 }: SaveButtonProps) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePress = () => {
    scale.value = withSpring(1.25, { damping: 6, stiffness: 200 }, () => {
      scale.value = withSpring(1, { damping: 8, stiffness: 300 })
    })
    onToggle()
  }

  return (
    <AnimatedPressable
      style={[styles.container, animatedStyle]}
      onPress={handlePress}
      hitSlop={8}
    >
      <Bookmark
        size={size}
        color="#fff"
        fill={isSaved ? '#fff' : 'transparent'}
        strokeWidth={1.8}
      />
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
})
