import { LinearGradient } from 'expo-linear-gradient'
import React, { useEffect, useRef } from 'react'
import { Animated, StyleSheet, Text } from 'react-native'
import { Fonts } from '../theme'

type Variant = 'success' | 'error' | 'bonus' | 'milestone'

interface Props {
  message: string
  variant: Variant
  visible: boolean
  onHide: () => void
}

const BG: Record<Variant, string> = {
  success: '#007b5b',
  error: '#920418',
  bonus: '#b45309',
  milestone: '#6c47ff',
}

const BONUS_GRADIENT: [string, string] = ['#f59e0b', '#d97706']

export default function Toast({ message, variant, visible, onHide }: Props) {
  const translateY = useRef(new Animated.Value(-100)).current
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start()

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => onHide())
      }, 1500)

      return () => clearTimeout(timer)
    }
  }, [visible])

  if (!visible) return null

  const content = (
    <Text style={styles.text}>{message}</Text>
  )

  const animStyle = {
    transform: [{ translateY }],
    opacity,
  }

  if (variant === 'bonus') {
    return (
      <Animated.View style={[styles.container, animStyle]}>
        <LinearGradient colors={BONUS_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.inner}>
          {content}
        </LinearGradient>
      </Animated.View>
    )
  }

  return (
    <Animated.View style={[styles.container, { backgroundColor: BG[variant] }, animStyle]}>
      {content}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 56,
    left: 16,
    right: 16,
    borderRadius: 12,
    zIndex: 999,
    overflow: 'hidden',
  },
  inner: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  text: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: '#ffffff',
    textAlign: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
})
