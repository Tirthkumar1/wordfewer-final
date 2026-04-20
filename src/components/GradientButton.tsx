import { LinearGradient } from 'expo-linear-gradient'
import React, { useRef } from 'react'
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Fonts } from '../theme'

interface Props {
  label: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export default function GradientButton({ label, onPress, style, disabled }: Props) {
  const scale = useRef(new Animated.Value(1)).current

  function handlePressIn() {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start()
  }

  function handlePressOut() {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 40,
      bounciness: 4,
    }).start()
  }

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={({ pressed }) => [styles.pressable, disabled && styles.disabled]}
      >
        <LinearGradient
          colors={['#6C47FF', '#FFB3AF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <Text style={styles.label}>{label}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  disabled: {
    opacity: 0.5,
  },
  gradient: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  label: {
    fontFamily: Fonts.game,
    fontSize: 20,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
})
