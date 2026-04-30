import MaskedView from '@react-native-masked-view/masked-view'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect, useState } from 'react'
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import GradientButton from '../components/GradientButton'
import NeuralBackground from '../components/NeuralBackground'
import { getWordlist } from '../config/wordlists'
import { useGame } from '../store/gameStore'
import { Colors, Fonts, getNativeFont } from '../theme'
import type { RootStackParamList } from '../navigation/AppNavigator'

// Stubbed for local testing
const purchaseAllLanguages = async () => false

type Nav = StackNavigationProp<RootStackParamList>

// ─── Language data ────────────────────────────────────────────────────────────

interface LangMeta {
  id: string
  flag: string
  native: string
  english: string
  script: string
  chainRule: string
  badge: string
  iapTier: 'free' | 'premium'
}

const LANGUAGES: LangMeta[] = [
  { id: 'en', flag: '🇬🇧', native: 'English',    english: 'English',  script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'free' },
  { id: 'de', flag: '🇩🇪', native: 'Deutsch',    english: 'German',   script: 'latin',      chainRule: 'last_letter', badge: 'WORD CHAIN',   iapTier: 'free' },
  { id: 'gu', flag: '🇮🇳', native: 'ગુજરાતી',   english: 'Gujarati', script: 'gujarati',   chainRule: 'last_akshar', badge: 'ANTYAKSHARI',  iapTier: 'free' },
  { id: 'hi', flag: '🇮🇳', native: 'हिंदी',      english: 'Hindi',    script: 'devanagari', chainRule: 'last_akshar', badge: 'ANTYAKSHARI',  iapTier: 'free' },
  { id: 'fr', flag: '🇫🇷', native: 'Français',   english: 'French',   script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
  { id: 'es', flag: '🇪🇸', native: 'Español',    english: 'Spanish',  script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
  { id: 'it', flag: '🇮🇹', native: 'Italiano',   english: 'Italian',  script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
  { id: 'pl', flag: '🇵🇱', native: 'Polski',     english: 'Polish',   script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
  { id: 'ro', flag: '🇷🇴', native: 'Română',     english: 'Romanian', script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
  { id: 'nl', flag: '🇳🇱', native: 'Nederlands', english: 'Dutch',    script: 'latin',      chainRule: 'last_letter', badge: 'LAST LETTER',  iapTier: 'premium' },
]

// ─── Icons ────────────────────────────────────────────────────────────────────

function BackIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M19 12H5M5 12l7 7M5 12l7-7" stroke={Colors.onSurface} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={11} cy={11} r={8} stroke={Colors.onSurfaceVariant} strokeWidth={2} />
      <Path d="M21 21l-4.35-4.35" stroke={Colors.onSurfaceVariant} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  )
}

function CrownIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path d="M2 20h20M4 20L2 8l6 5 4-8 4 8 6-5-2 12H4z" stroke="#ffffff" strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  )
}

function LockIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Path d="M7 11V7a5 5 0 0110 0v4" stroke={Colors.onSurfaceVariant} strokeWidth={2} strokeLinecap="round" />
      <Svg x={1} y={10} width={22} height={14}>
        <Path d="M2 2h18a2 2 0 012 2v8a2 2 0 01-2 2H2a2 2 0 01-2-2V4a2 2 0 012-2z" fill={Colors.surfaceHigh} stroke={Colors.outlineVariant} strokeWidth={2} />
      </Svg>
    </Svg>
  )
}

function CheckCircle() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={Colors.primaryContainer} />
      <Path d="M8 12l3 3 5-5" stroke="#ffffff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

// ─── Language row ─────────────────────────────────────────────────────────────

function LanguageRow({
  lang,
  selected,
  onPress,
}: {
  lang: LangMeta
  selected: boolean
  onPress: () => void
}) {
  const isLocked = lang.iapTier === 'premium'
  const nativeFont = getNativeFont(lang.script)

  return (
    <Pressable
      onPress={isLocked ? undefined : onPress}
      style={[
        styles.langRow,
        selected && styles.langRowSelected,
        isLocked && styles.langRowLocked,
      ]}
    >
      <Text style={[styles.langFlag, isLocked && styles.lockedFlag]}>{lang.flag}</Text>
      <View style={styles.langInfo}>
        <Text style={[styles.langNative, { fontFamily: nativeFont }]}>{lang.native}</Text>
        <Text style={styles.langEnglish}>{lang.english}</Text>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{lang.badge}</Text>
      </View>
      {isLocked ? (
        <LockIcon />
      ) : selected ? (
        <CheckCircle />
      ) : null}
    </Pressable>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function LanguagePickerScreen() {
  const navigation = useNavigation<Nav>()
  const { state, dispatch } = useGame()
  const [selected, setSelected] = useState(state.languageId)
  const [query, setQuery] = useState('')

  useEffect(() => {
    setSelected(state.languageId)
  }, [state.languageId])

  const filtered = LANGUAGES.filter(
    (l) =>
      l.native.toLowerCase().includes(query.toLowerCase()) ||
      l.english.toLowerCase().includes(query.toLowerCase()),
  )

  const free = filtered.filter((l) => l.iapTier === 'free')
  const premium = filtered.filter((l) => l.iapTier === 'premium')

  function handleConfirm() {
    const lang = LANGUAGES.find((l) => l.id === selected)
    if (!lang) return
    const words = getWordlist(lang.id)
    dispatch({
      type: 'SET_LANGUAGE',
      payload: {
        languageId: lang.id,
        script: lang.script,
        chainRule: lang.chainRule,
        wordlist: words,
      },
    })
    if (navigation.canGoBack()) navigation.goBack()
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NeuralBackground />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <BackIcon />
        </Pressable>
        <MaskedView maskElement={<Text style={styles.wordmark}>WordFever</Text>}>
          <LinearGradient colors={['#6C47FF', '#FFB3AF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={[styles.wordmark, { opacity: 0 }]}>WordFever</Text>
          </LinearGradient>
        </MaskedView>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Title */}
        <Text style={styles.title}>{'Choose your\nlanguage'}</Text>
        <Text style={styles.subtitle}>Your dictionary. Your rules.</Text>

        {/* Search */}
        <View style={styles.searchBar}>
          <SearchIcon />
          <TextInput
            style={styles.searchInput}
            placeholder="Search languages..."
            placeholderTextColor={Colors.onSurfaceVariant}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
        </View>

        {/* Unlock all banner */}
        <Pressable onPress={() => purchaseAllLanguages()}>
          <LinearGradient
            colors={['#6C47FF', '#920418']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.unlockBanner}
          >
            <CrownIcon />
            <View style={styles.unlockText}>
              <Text style={styles.unlockTitle}>Unlock all</Text>
              <Text style={styles.unlockSub}>Access 25+ global languages</Text>
            </View>
            <Text style={styles.unlockPrice}>{'₹49 / €1.99\nONE-TIME'}</Text>
          </LinearGradient>
        </Pressable>

        {/* Free languages */}
        {free.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>FREE LANGUAGES</Text>
            {free.map((l) => (
              <LanguageRow
                key={l.id}
                lang={l}
                selected={selected === l.id}
                onPress={() => setSelected(l.id)}
              />
            ))}
          </>
        )}

        {/* Premium languages */}
        {premium.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>PREMIUM LANGUAGES</Text>
            {premium.map((l) => (
              <LanguageRow
                key={l.id}
                lang={l}
                selected={false}
                onPress={() => {}}
              />
            ))}
          </>
        )}

        {/* Confirm button clearance */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Fixed confirm button */}
      <View style={styles.confirmWrap}>
        <GradientButton label="Confirm Language" onPress={handleConfirm} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
    marginTop: 80,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Header
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    height: 80,
    paddingTop: 44,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19,18,27,0.8)',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmark: {
    fontFamily: Fonts.headlineEB,
    fontSize: 20,
    color: '#6C47FF',
  },

  // Title
  title: {
    fontFamily: Fonts.headlineEB,
    fontSize: 36,
    color: Colors.onSurface,
    lineHeight: 42,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurfaceVariant,
    marginBottom: 20,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.onSurface,
    padding: 0,
  },

  // Unlock banner
  unlockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    marginBottom: 24,
  },
  unlockText: {
    flex: 1,
  },
  unlockTitle: {
    fontFamily: Fonts.headline,
    fontSize: 16,
    color: '#ffffff',
  },
  unlockSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  unlockPrice: {
    fontFamily: Fonts.headline,
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'right',
    lineHeight: 18,
  },

  // Section label
  sectionLabel: {
    fontFamily: Fonts.body,
    fontSize: 10,
    letterSpacing: 1.5,
    color: Colors.onSurfaceVariant,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },

  // Language row
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderLeftWidth: 0,
  },
  langRowSelected: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primaryContainer,
  },
  langRowLocked: {
    opacity: 0.6,
  },
  langFlag: {
    fontSize: 32,
    width: 40,
    textAlign: 'center',
  },
  lockedFlag: {
    opacity: 0.4,
  },
  langInfo: {
    flex: 1,
  },
  langNative: {
    fontSize: 16,
    color: Colors.onSurface,
    fontFamily: Fonts.headline,
  },
  langEnglish: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.onSurfaceVariant,
    marginTop: 2,
  },
  badge: {
    backgroundColor: Colors.surfaceHigh,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontFamily: Fonts.body,
    fontSize: 10,
    color: Colors.onSurfaceVariant,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  // Confirm
  confirmWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 32,
    paddingTop: 16,
    backgroundColor: 'rgba(19,18,27,0.95)',
  },
})
