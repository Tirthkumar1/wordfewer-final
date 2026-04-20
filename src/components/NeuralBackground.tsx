import React, { useMemo } from 'react'
import { StyleSheet, View, type ViewStyle } from 'react-native'

const DOT_COLOR = 'rgba(108,71,255,0.08)'
const SPACING = 24
const DOT_SIZE = 4

interface Props {
  style?: ViewStyle
}

export default function NeuralBackground({ style }: Props) {
  const dots = useMemo(() => {
    const cols = Math.ceil(400 / SPACING) + 2
    const rows = Math.ceil(900 / SPACING) + 2
    const items: { key: string; top: number; left: number }[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        items.push({ key: `${r}-${c}`, top: r * SPACING, left: c * SPACING })
      }
    }
    return items
  }, [])

  return (
    <View style={[StyleSheet.absoluteFill, styles.container, style]} pointerEvents="none">
      {dots.map((d) => (
        <View key={d.key} style={[styles.dot, { top: d.top, left: d.left }]} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_COLOR,
  },
})
