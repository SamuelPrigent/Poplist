import React from 'react'
import { Pressable, View, StyleSheet } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated'
import { CirclePlus, Check } from 'lucide-react-native'
import { colors } from '../constants/theme'

interface SaveButtonProps {
  isSaved: boolean
  onToggle: () => void
  size?: number
}

export default function SaveButton({ isSaved, onToggle, size = 26 }: SaveButtonProps) {
  const sonarScale = useSharedValue(1)
  const sonarOpacity = useSharedValue(0)

  const sonarStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sonarScale.value }],
    opacity: sonarOpacity.value,
  }))

  const handlePress = () => {
    // Sonar pulse on tap
    sonarScale.value = 1
    sonarOpacity.value = 0.35
    sonarScale.value = withTiming(2.2, { duration: 400 })
    sonarOpacity.value = withTiming(0, { duration: 400 })
    onToggle()
  }

  const circleSize = size * 0.95

  return (
    <Pressable style={styles.container} onPress={handlePress} hitSlop={8}>
      {/* Sonar ring */}
      <Animated.View
        style={[
          styles.sonarRing,
          {
            width: circleSize,
            height: circleSize,
            borderRadius: circleSize / 2,
            borderColor: isSaved ? '#22c55e' : '#fff',
          },
          sonarStyle,
        ]}
        pointerEvents="none"
      />

      {/* Icon */}
      {isSaved ? (
        <View
          style={[
            styles.savedCircle,
            {
              width: circleSize,
              height: circleSize,
              borderRadius: circleSize / 2,
            },
          ]}
        >
          <Check size={size * 0.55} color={colors.background} strokeWidth={3} />
        </View>
      ) : (
        <CirclePlus size={size} color="#fff" strokeWidth={1.8} />
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sonarRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  savedCircle: {
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
})
