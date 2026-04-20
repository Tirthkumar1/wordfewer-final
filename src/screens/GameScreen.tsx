import AsyncStorage from '@react-native-async-storage/async-storage'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Path } from 'react-native-svg'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import NeuralBackground from '../components/NeuralBackground'
import Toast from '../components/Toast'
import type { RootStackParamList } from '../navigation/AppNavigator'
import { showRewarded } from '../services/AdService'
import { useGame } from '../store/gameStore'
import { Colors, Fonts, getNativeFont } from '../theme'

type Nav = StackNavigationProp<RootStackParamList>

// ─── Romanisation map for Indic akshars ──────────────────────────────────────

const ROMAN_MAP: Record<string, string> = {
  'ક': 'KA', 'ખ': 'KHA', 'ગ': 'GA', 'ઘ': 'GHA', 'ચ': 'CHA',
  'છ': 'CHHA', 'જ': 'JA', 'ઝ': 'JHA', 'ટ': 'TA', 'ઠ': 'THA',
  'ડ': 'DA', 'ઢ': 'DHA', 'ણ': 'NA', 'ત': 'TA', 'થ': 'THA',
  'દ': 'DA', 'ધ': 'DHA', 'ન': 'NA', 'પ': 'PA', 'ફ': 'PHA',
  'બ': 'BA', 'ભ': 'BHA', 'મ': 'MA', 'ય': 'YA', 'ર': 'RA',
  'લ': 'LA', 'વ': 'VA', 'શ': 'SHA', 'ષ': 'SHA', 'સ': 'SA',
  'હ': 'HA', 'ળ': 'LA', 'ક્ષ': 'KSH', 'જ્ઞ': 'GYA',
  // Devanagari
  'क': 'KA', 'ख': 'KHA', 'ग': 'GA', 'घ': 'GHA', 'च': 'CHA',
  'छ': 'CHHA', 'ज': 'JA', 'झ': 'JHA', 'ट': 'TA', 'ठ': 'THA',
  'ड': 'DA', 'ढ': 'DHA', 'ण': 'NA', 'त': 'TA', 'थ': 'THA',
  'द': 'DA', 'ध': 'DHA', 'न': 'NA', 'प': 'PA', 'फ': 'PHA',
  'ब': 'BA', 'भ': 'BHA', 'म': 'MA', 'य': 'YA', 'र': 'RA',
  'ल': 'LA', 'व': 'VA', 'श': 'SHA', 'ष': 'SHA', 'स': 'SA',
  'ह': 'HA', 'ळ': 'LA',
}

function getRomanization(akshar: string): string {
  return ROMAN_MAP[akshar] ?? ''
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function PauseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M10 4H6v16h4V4zM18 4h-4v16h4V4z" fill={Colors.onSurface} />
    </Svg>
  )
}

function ArrowUpIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5l-7 7h4v7h6v-7h4l-7-7z" fill="#68000d" />
    </Svg>
  )
}

function ArrowRightIcon({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function LinkSmallIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke={Colors.secondary} strokeWidth={2} strokeLinecap="round" />
      <Path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke={Colors.secondary} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

// ─── Timer bar fill color ─────────────────────────────────────────────────────

function timerColor(t: number): string {
  if (t > 6) return Colors.tertiary
  if (t >= 3) return '#FFB800'
  return Colors.secondary
}

// ─── GameScreen ───────────────────────────────────────────────────────────────

export default function GameScreen() {
  const navigation = useNavigation<Nav>()
  const { state, dispatch } = useGame()

  const [input, setInput] = useState('')
  const [paused, setPaused] = useState(false)
  const [showFreeze, setShowFreeze] = useState(false)
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' | 'bonus' | 'milestone' } | null>(null)
  const [toastVisible, setToastVisible] = useState(false)

  const inputRef = useRef<TextInput>(null)
  const trailRef = useRef<ScrollView>(null)
  const timerBarAnim = useRef(new Animated.Value(1)).current
  const timerBarAnimation = useRef<Animated.CompositeAnimation | null>(null)
  const shakeAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  const wordSlideAnim = useRef(new Animated.Value(30)).current
  const wordOpacityAnim = useRef(new Animated.Value(0)).current
  const freezeShownAt = useRef<number>(-1)

  const { status, timeRemaining, baseTime, chain, score, currentWord, requiredUnit, script, languageId } = state
  const isIndic = script === 'gujarati' || script === 'devanagari'

  // Navigate to game over
  useEffect(() => {
    if (status === 'gameover') {
      navigation.replace('GameOver', {
        score: state.score,
        chainLength: state.chain.length,
        languageId: state.languageId,
      })
    }
  }, [status])

  // Auto-start game if idle
  useEffect(() => {
    if (status === 'idle') dispatch({ type: 'START_GAME' })
  }, [])

  // Tick interval
  useEffect(() => {
    if (status !== 'playing') return
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000)
    return () => clearInterval(id)
  }, [status])

  // Expire when timer hits 0
  useEffect(() => {
    if (status === 'playing' && timeRemaining === 0) {
      dispatch({ type: 'EXPIRE' })
    }
  }, [timeRemaining, status])

  // Shake + freeze prompt at 3s
  useEffect(() => {
    if (status === 'playing' && timeRemaining === 3 && freezeShownAt.current !== chain.length) {
      freezeShownAt.current = chain.length
      // Shake
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -4, duration: 80, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start()
      setShowFreeze(true)
    }
  }, [timeRemaining, status])

  // Timer bar width animation — restart each time baseTime resets
  useEffect(() => {
    timerBarAnimation.current?.stop()
    timerBarAnim.setValue(1)
    const anim = Animated.timing(timerBarAnim, {
      toValue: 0,
      duration: baseTime * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    })
    timerBarAnimation.current = anim
    if (status === 'playing') anim.start()
  }, [baseTime, currentWord])

  // Pulse animation on required letter circle
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.04, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sine) }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 1000, useNativeDriver: true, easing: Easing.inOut(Easing.sine) }),
      ]),
    )
    loop.start()
    return () => loop.stop()
  }, [])

  // Word slide animation on new word
  useEffect(() => {
    wordSlideAnim.setValue(30)
    wordOpacityAnim.setValue(0)
    Animated.parallel([
      Animated.spring(wordSlideAnim, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 8 }),
      Animated.timing(wordOpacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start()
  }, [currentWord])

  // Auto-scroll trail
  useEffect(() => {
    setTimeout(() => trailRef.current?.scrollToEnd({ animated: true }), 100)
  }, [chain.length])

  function showToast(message: string, variant: 'success' | 'error' | 'bonus' | 'milestone') {
    setToast({ message, variant })
    setToastVisible(true)
  }

  const handleSubmit = useCallback(() => {
    const word = input.trim()
    if (!word) return
    const prevChainLen = chain.length

    dispatch({ type: 'SUBMIT_WORD', payload: word })

    // Evaluate result based on current state before dispatch
    const { invalidAttempt, lastBonus } = state

    setInput('')

    // We read next render state via a tiny delay
    setTimeout(() => {
      const newState = state
      if (state.chain.length > prevChainLen) {
        // word was accepted
        const pts = word.length * 10
        if (state.lastBonus === 'rare') {
          showToast(`★ Rare letter! +${pts + 60} pts`, 'bonus')
        } else if (state.lastBonus === 'milestone') {
          showToast(`🔗 Chain of ${state.chain.length}! Keep going!`, 'milestone')
        } else {
          showToast(`✓ +${pts} pts`, 'success')
        }
      } else {
        showToast('✗ Not in dictionary', 'error')
      }
    }, 50)
  }, [input, chain.length, state, dispatch])

  async function handleFreezeAccept() {
    setShowFreeze(false)
    const rewarded = await showRewarded()
    if (rewarded) dispatch({ type: 'FREEZE_TIMER', payload: 5 })
  }

  function handlePause() {
    dispatch({ type: 'PAUSE' })
    setPaused(true)
  }

  function handleResume() {
    dispatch({ type: 'RESUME' })
    setPaused(false)
  }

  function handleQuit() {
    dispatch({ type: 'RESET' })
    navigation.navigate('Tabs')
  }

  const trailWords = chain.slice(-5)
  const barColor = timerColor(timeRemaining)
  const letterFont = isIndic
    ? getNativeFont(script)
    : Fonts.game
  const letterSize = isIndic ? 80 : 96
  const romanization = isIndic ? getRomanization(requiredUnit) : null

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <NeuralBackground />

      {/* TOP BAR */}
      <View style={styles.topBar}>
        {/* Chain counter */}
        <View style={styles.chainPill}>
          <LinkSmallIcon />
          <Text style={styles.chainNum}>{chain.length}</Text>
        </View>

        {/* Score */}
        <View style={styles.scoreCenter}>
          <Text style={styles.scoreLabel}>TOTAL SCORE</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>

        {/* Pause */}
        <Pressable style={styles.pauseBtn} onPress={handlePause} hitSlop={8}>
          <PauseIcon />
        </Pressable>
      </View>

      {/* WORD TRAIL */}
      <View style={styles.trailWrapper}>
        <ScrollView
          ref={trailRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.trailContent}
        >
          {trailWords.map((w, i) => (
            <React.Fragment key={`${w}-${i}`}>
              <View style={styles.trailPill}>
                <Text style={styles.trailWord}>{w}</Text>
              </View>
              {i < trailWords.length - 1 && (
                <View style={styles.trailArrow}>
                  <ArrowRightIcon color={Colors.outlineVariant} />
                </View>
              )}
            </React.Fragment>
          ))}
        </ScrollView>
        {/* Left fade mask */}
        <View pointerEvents="none" style={styles.trailFadeMask} />
      </View>

      {/* CURRENT WORD CHIP */}
      {currentWord !== '' && (
        <Animated.View
          style={[
            styles.currentWordChip,
            { transform: [{ translateY: wordSlideAnim }], opacity: wordOpacityAnim },
          ]}
        >
          <Text style={styles.currentWordText}>{currentWord}</Text>
          <ArrowRightIcon color={Colors.primary} />
        </Animated.View>
      )}

      {/* REQUIRED LETTER HERO */}
      <View style={styles.heroSection}>
        <Text style={styles.startsWithLabel}>Next word starts with</Text>

        <View style={styles.circleWrapper}>
          {/* Glow */}
          <Animated.View style={[styles.circleGlow, { transform: [{ scale: pulseAnim }] }]} />

          {/* Circle */}
          <Animated.View style={[styles.circle, { transform: [{ scale: pulseAnim }] }]}>
            <Text style={[styles.requiredLetter, { fontFamily: letterFont, fontSize: letterSize }]}>
              {requiredUnit}
            </Text>
            {romanization ? (
              <Text style={styles.romanization}>{romanization}</Text>
            ) : null}
          </Animated.View>
        </View>
      </View>

      {/* TIMER SECTION */}
      <Animated.View style={[styles.timerSection, { transform: [{ translateX: shakeAnim }] }]}>
        <Text style={[styles.timerNum, { color: barColor }]}>{timeRemaining}</Text>
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                backgroundColor: barColor,
                width: timerBarAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </Animated.View>

      {/* INPUT CARD */}
      <View style={styles.inputCard}>
        {isIndic && (
          <Text style={[styles.indicHint, { fontFamily: getNativeFont(script) }]}>
            {requiredUnit}
          </Text>
        )}
        <View style={styles.inputRow}>
          <TextInput
            ref={inputRef}
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type next word…"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
          />
          <Pressable style={styles.submitBtn} onPress={handleSubmit}>
            <ArrowUpIcon />
          </Pressable>
        </View>
      </View>

      {/* TOAST */}
      {toast && (
        <Toast
          message={toast.message}
          variant={toast.variant}
          visible={toastVisible}
          onHide={() => { setToastVisible(false); setToast(null) }}
        />
      )}

      {/* FREEZE MODAL */}
      <Modal visible={showFreeze} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.freezeCard}>
            <Text style={styles.freezeTitle}>⏳ Running out of time!</Text>
            <Text style={styles.freezeSub}>❄️ Watch a short ad to freeze +5 seconds</Text>
            <View style={styles.freezeButtons}>
              <GradientButton label="Watch Ad → +5s" onPress={handleFreezeAccept} style={{ flex: 1 }} />
              <GhostButton label="Dismiss" onPress={() => setShowFreeze(false)} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>

      {/* PAUSE MODAL */}
      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.pauseCard}>
            <Text style={styles.pauseTitle}>Paused</Text>
            <GradientButton label="Resume" onPress={handleResume} style={styles.modalBtn} />
            <GhostButton label="Quit" onPress={handleQuit} style={styles.modalBtn} />
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: 'rgba(19,18,27,0.8)',
    zIndex: 10,
  },
  chainPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(146,4,24,0.2)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chainNum: {
    fontFamily: Fonts.headline,
    fontSize: 14,
    color: Colors.secondary,
  },
  scoreCenter: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  scoreValue: {
    fontFamily: Fonts.game,
    fontSize: 20,
    color: Colors.onSurface,
  },
  pauseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Trail
  trailWrapper: {
    marginTop: 12,
    height: 44,
  },
  trailContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  trailPill: {
    backgroundColor: Colors.surfaceLow,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  trailWord: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: '#94a3b8',
  },
  trailArrow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  trailFadeMask: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 32,
    backgroundColor: 'transparent',
  },

  // Current word chip
  currentWordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 8,
    backgroundColor: 'rgba(108,71,255,0.10)',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,190,255,0.20)',
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginTop: 16,
  },
  currentWordText: {
    fontFamily: Fonts.game,
    fontSize: 18,
    color: '#e6deff',
  },

  // Hero letter
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  startsWithLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: '#94a3b8',
  },
  circleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 192,
    height: 192,
  },
  circleGlow: {
    position: 'absolute',
    width: 192,
    height: 192,
    borderRadius: 96,
    backgroundColor: 'rgba(108,71,255,0.20)',
  },
  circle: {
    width: 192,
    height: 192,
    borderRadius: 96,
    borderWidth: 4,
    borderColor: Colors.primaryContainer,
    backgroundColor: Colors.surfaceLowest,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  requiredLetter: {
    color: Colors.primary,
    lineHeight: 110,
  },
  romanization: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.primary,
    opacity: 0.6,
    marginTop: -8,
  },

  // Timer
  timerSection: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  timerNum: {
    fontFamily: Fonts.game,
    fontSize: 32,
    fontStyle: 'italic',
    textAlign: 'right',
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.surfaceHighest,
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },

  // Input card
  inputCard: {
    margin: 12,
    marginBottom: 100,
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 24,
    padding: 8,
  },
  indicHint: {
    fontSize: 32,
    color: Colors.primary,
    textAlign: 'center',
    paddingVertical: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: Fonts.bodyMedium,
    fontSize: 18,
    color: Colors.onSurface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
  },
  submitBtn: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(19,18,27,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  freezeCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    gap: 16,
  },
  freezeTitle: {
    fontFamily: Fonts.headline,
    fontSize: 18,
    color: Colors.onSurface,
    textAlign: 'center',
  },
  freezeSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    textAlign: 'center',
  },
  freezeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pauseCard: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 20,
    padding: 32,
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  pauseTitle: {
    fontFamily: Fonts.headlineEB,
    fontSize: 32,
    color: Colors.onSurface,
    marginBottom: 8,
  },
  modalBtn: {
    width: '100%',
  },
})
