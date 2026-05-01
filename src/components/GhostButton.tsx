import React from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { Colors, Fonts } from '../theme'

interface Props {
  label: string
  onPress: () => void
  style?: StyleProp<ViewStyle>
  disabled?: boolean
}

export default function GhostButton({ label, onPress, style, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled, style]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(72,69,86,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 16,
    color: Colors.primary,
  },
})
