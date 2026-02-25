import React, { useRef, useCallback } from 'react'
import { View, StyleSheet, Alert, Pressable } from 'react-native'
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable'
import Animated, {
  SharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated'
import { Trash2 } from 'lucide-react-native'

const DELETE_ACTION_WIDTH = 80
const DELETE_COLOR = '#f59e0b'

interface SwipeableRowProps {
  children: React.ReactNode
  onDelete: () => void
  enabled?: boolean
}

export default function SwipeableRow({
  children,
  onDelete,
  enabled = true,
}: SwipeableRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null)

  const handleDeletePress = useCallback(() => {
    Alert.alert(
      'Supprimer cet \u00e9l\u00e9ment ?',
      undefined,
      [
        {
          text: 'Annuler',
          style: 'cancel',
          onPress: () => swipeableRef.current?.close(),
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            swipeableRef.current?.close()
            onDelete()
          },
        },
      ],
    )
  }, [onDelete])

  const renderRightActions = useCallback(
    (progress: SharedValue<number>, translation: SharedValue<number>) => {
      return (
        <RightAction
          progress={progress}
          translation={translation}
          onPress={handleDeletePress}
        />
      )
    },
    [handleDeletePress],
  )

  if (!enabled) {
    return <>{children}</>
  }

  return (
    <ReanimatedSwipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleDeletePress}
    >
      {children}
    </ReanimatedSwipeable>
  )
}

/**
 * The delete action revealed when swiping left.
 * Animated: icon fades/scales in as the swipe progresses.
 */
function RightAction({
  progress,
  onPress,
}: {
  progress: SharedValue<number>
  translation: SharedValue<number>
  onPress: () => void
}) {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.6, 0.9, 1],
      Extrapolation.CLAMP,
    )
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0.7, 1],
      Extrapolation.CLAMP,
    )
    return { transform: [{ scale }], opacity }
  })

  return (
    <Pressable onPress={onPress} style={styles.rightAction}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <Trash2 size={24} color="#fff" />
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  rightAction: {
    width: DELETE_ACTION_WIDTH,
    backgroundColor: DELETE_COLOR,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
})
