import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import React, { useCallback, useState } from 'react'
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Svg, { Circle, Path } from 'react-native-svg'
import GhostButton from '../components/GhostButton'
import GradientButton from '../components/GradientButton'
import { StorageKeys } from '../config/storageKeys'
import { getStoredUser, signOut, type GoogleUser } from '../services/AuthService'
import { useGame } from '../store/gameStore'
import { Colors, Fonts } from '../theme'

interface Stats {
  bestChain: number
  bestScore: number
  totalWords: number
  streak: number
  joinDate: string
}

interface Achievement {
  id: string
  label: string
  description: string
  icon: string
  earned: boolean
}

const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧', de: '🇩🇪', gu: '🇮🇳', hi: '🇮🇳',
  fr: '🇫🇷', es: '🇪🇸', it: '🇮🇹', pl: '🇵🇱', ro: '🇷🇴', nl: '🇳🇱',
}

function VerifiedIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={Colors.primaryContainer} />
      <Path d="M8 12l3 3 5-5" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <View style={[styles.badge, !achievement.earned && styles.badgeLocked]}>
      <Text style={styles.badgeIcon}>{achievement.icon}</Text>
      <Text style={[styles.badgeLabel, !achievement.earned && styles.badgeLabelLocked]}>
        {achievement.label}
      </Text>
      <Text style={styles.badgeDesc}>{achievement.description}</Text>
    </View>
  )
}

export default function ProfileScreen() {
  const { state } = useGame()
  const [stats, setStats] = useState<Stats>({
    bestChain: 0, bestScore: 0, totalWords: 0, streak: 0, joinDate: '',
  })
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editInput, setEditInput] = useState('')

  useFocusEffect(useCallback(() => { load() }, []))

  async function load() {
    const [pb, streak, total, join, gUser] = await Promise.all([
      AsyncStorage.getItem(StorageKeys.PERSONAL_BEST),
      AsyncStorage.getItem(StorageKeys.STREAK),
      AsyncStorage.getItem(StorageKeys.TOTAL_WORDS),
      AsyncStorage.getItem(StorageKeys.JOIN_DATE),
      getStoredUser(),
    ])
    const today = new Date().toISOString().split('T')[0]
    if (!join) await AsyncStorage.setItem(StorageKeys.JOIN_DATE, today)
    const pbParsed = pb ? JSON.parse(pb) : { chain: 0, score: 0 }
    setStats({
      bestChain: pbParsed.chain ?? 0,
      bestScore: pbParsed.score ?? 0,
      totalWords: parseInt(total ?? '0', 10),
      streak: parseInt(streak ?? '0', 10),
      joinDate: join ?? today,
    })
    if (gUser) setGoogleUser(gUser)
  }

  const username = googleUser?.name ?? 'Player'

  async function handleSaveUsername() {
    const name = editInput.trim()
    if (!name) return
    await AsyncStorage.setItem(StorageKeys.USERNAME, name)
    if (googleUser) setGoogleUser({ ...googleUser, name })
    setShowEditModal(false)
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut()
          // App.tsx will detect no stored user and show SignInScreen on next launch.
          // For immediate effect, just clear local state.
          Alert.alert('Signed out', 'Restart the app to sign in again.')
        },
      },
    ])
  }

  const joinFormatted = stats.joinDate
    ? new Date(stats.joinDate).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
    : '—'

  const achievements: Achievement[] = [
    { id: 'first_chain',   label: 'First Chain',    description: 'Complete a game',      icon: '🎮', earned: stats.totalWords > 0 },
    { id: 'chain_10',      label: 'Chain x10',      description: '10+ word chain',        icon: '🔗', earned: stats.bestChain >= 10 },
    { id: 'chain_25',      label: 'Chain x25',      description: '25+ word chain',        icon: '⛓️', earned: stats.bestChain >= 25 },
    { id: 'chain_master',  label: 'Chain Master',   description: '50+ word chain',        icon: '🧠', earned: stats.bestChain >= 50 },
    { id: 'score_1k',      label: 'Four Figures',   description: 'Score 1,000+ pts',      icon: '💯', earned: stats.bestScore >= 1000 },
    { id: 'score_10k',     label: 'Ten Grand',      description: 'Score 10,000+ pts',     icon: '🏅', earned: stats.bestScore >= 10000 },
    { id: 'score_20k',     label: 'Word Wizard',    description: 'Score 20,000+ pts',     icon: '🧙', earned: stats.bestScore >= 20000 },
    { id: 'score_50k',     label: 'Legendary',      description: 'Score 50,000+ pts',     icon: '👑', earned: stats.bestScore >= 50000 },
    { id: 'daily_devotee', label: 'Daily Devotee',  description: '7-day streak',          icon: '🔥', earned: stats.streak >= 7 },
    { id: 'polyglot',      label: 'Polyglot',       description: 'Play 3+ languages',     icon: '🌍', earned: false },
    { id: 'word_100',      label: 'Century',        description: '100 total words played', icon: '💪', earned: stats.totalWords >= 100 },
    { id: 'word_1k',       label: 'Wordsmith',      description: '1,000 words played',    icon: '📖', earned: stats.totalWords >= 1000 },
  ]

  async function handleShareProfile() {
    try {
      await Share.share({
        message: `I'm ${username} on WordFever! Best chain: ${stats.bestChain} words, best score: ${stats.bestScore} pts. Can you beat me?`,
      })
    } catch {}
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarRing}>
            {googleUser?.photo ? (
              <Image source={{ uri: googleUser.photo }} style={styles.avatarPhoto} />
            ) : (
              <View style={styles.avatarInner}>
                <Text style={styles.avatarInitial}>{username[0].toUpperCase()}</Text>
              </View>
            )}
          </View>
          <View style={styles.verifiedRow}>
            <Text style={styles.usernameText}>{username}</Text>
            <VerifiedIcon />
          </View>
          {googleUser?.email ? (
            <Text style={styles.emailText}>{googleUser.email}</Text>
          ) : null}
          <Pressable onPress={() => { setEditInput(username); setShowEditModal(true) }}>
            <Text style={styles.editLink}>Edit display name</Text>
          </Pressable>
          <Text style={styles.joinDate}>Playing since {joinFormatted}</Text>
          <View style={styles.langPill}>
            <Text style={styles.langPillText}>
              {LANG_FLAGS[state.languageId] ?? '🌍'}  {state.languageId.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <StatBox label="BEST CHAIN" value={stats.bestChain} />
          <StatBox label="BEST SCORE" value={stats.bestScore} />
          <StatBox label="TOTAL WORDS" value={stats.totalWords} />
          <StatBox label="DAY STREAK" value={`${stats.streak}🔥`} />
        </View>

        {/* Achievements */}
        <Text style={styles.sectionLabel}>ACHIEVEMENTS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementsRow}
        >
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} />
          ))}
        </ScrollView>

        {/* Active languages */}
        <Text style={styles.sectionLabel}>ACTIVE LANGUAGES</Text>
        <View style={styles.langRow}>
          {['en', 'de', 'gu', 'hi'].map((l) => (
            <View key={l} style={[styles.langChip, state.languageId === l && styles.langChipActive]}>
              <Text style={styles.langChipText}>{LANG_FLAGS[l]} {l.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <GhostButton label="Share Profile" onPress={handleShareProfile} style={styles.btn} />
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit username modal */}
      <Modal visible={showEditModal} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>Change Username</Text>
            <TextInput
              style={styles.editInput}
              value={editInput}
              onChangeText={setEditInput}
              placeholder="New username"
              placeholderTextColor="#484556"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={20}
              autoFocus
            />
            <View style={styles.editBtns}>
              <Pressable style={styles.editCancel} onPress={() => setShowEditModal(false)}>
                <Text style={styles.editCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.editSave} onPress={handleSaveUsername}>
                <Text style={styles.editSaveText}>Save</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingHorizontal: 20 },

  avatarSection: { alignItems: 'center', paddingTop: 64, paddingBottom: 24, gap: 6 },
  avatarRing: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: Colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInner: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarPhoto: { width: 88, height: 88, borderRadius: 44 },
  avatarInitial: { fontFamily: Fonts.headlineEB, fontSize: 36, color: Colors.primary },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  usernameText: { fontFamily: Fonts.headlineEB, fontSize: 22, color: Colors.onSurface },
  emailText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant, marginTop: -2 },
  editLink: { fontFamily: Fonts.body, fontSize: 12, color: Colors.primaryContainer, marginTop: 2 },
  joinDate: { fontFamily: Fonts.body, fontSize: 13, color: Colors.onSurfaceVariant },
  langPill: {
    backgroundColor: Colors.surfaceHigh, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 6, marginTop: 4,
  },
  langPillText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurface },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  statBox: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 4,
  },
  statValue: { fontFamily: Fonts.game, fontSize: 28, color: Colors.primary },
  statLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.2, textTransform: 'uppercase',
  },

  sectionLabel: {
    fontFamily: Fonts.body, fontSize: 10,
    color: Colors.onSurfaceVariant, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: 12,
  },

  achievementsRow: { paddingRight: 20, gap: 12, marginBottom: 28 },
  badge: {
    backgroundColor: Colors.surface, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 4, width: 100,
  },
  badgeLocked: { opacity: 0.4 },
  badgeIcon: { fontSize: 28 },
  badgeLabel: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.onSurface, textAlign: 'center' },
  badgeLabelLocked: { color: Colors.onSurfaceVariant },
  badgeDesc: { fontFamily: Fonts.body, fontSize: 10, color: Colors.onSurfaceVariant, textAlign: 'center' },

  langRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 28 },
  langChip: {
    backgroundColor: Colors.surface, borderRadius: 999,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  langChipActive: { backgroundColor: Colors.primaryContainer },
  langChipText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.onSurface },

  btn: { marginBottom: 12 },
  signOutBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 4,
  },
  signOutText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.secondary,
  },

  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  editCard: {
    width: '100%', backgroundColor: Colors.surfaceHigh,
    borderRadius: 20, padding: 24, gap: 16,
  },
  editTitle: { fontFamily: Fonts.bodyMedium, fontSize: 18, color: Colors.onSurface, textAlign: 'center' },
  editInput: {
    backgroundColor: Colors.background, borderRadius: 12,
    height: 50, paddingHorizontal: 16,
    fontFamily: Fonts.body, fontSize: 16, color: Colors.onSurface,
  },
  editBtns: { flexDirection: 'row', gap: 12 },
  editCancel: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: Colors.surfaceHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  editCancelText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.onSurfaceVariant },
  editSave: {
    flex: 1, height: 48, borderRadius: 12,
    backgroundColor: Colors.primaryContainer,
    alignItems: 'center', justifyContent: 'center',
  },
  editSaveText: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: '#ffffff' },
})
