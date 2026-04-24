import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Svg, { Circle, Path, Rect } from 'react-native-svg'
import { Colors } from '../theme'

import DailyChallengeScreen from '../screens/DailyChallengeScreen'
import GameOverScreen from '../screens/GameOverScreen'
import GameScreen from '../screens/GameScreen'
import HomeScreen from '../screens/HomeScreen'
import LanguagePickerScreen from '../screens/LanguagePickerScreen'
import LeaderboardScreen from '../screens/LeaderboardScreen'
import ProfileScreen from '../screens/ProfileScreen'

// ─── Tab icon SVGs ────────────────────────────────────────────────────────────

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12L12 3l9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  )
}

function LanguagesIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M2 12h20M12 2c-2.76 3.45-4 6.91-4 10s1.24 6.55 4 10M12 2c2.76 3.45 4 6.91 4 10s-1.24 6.55-4 10"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

function LeaderboardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={12} width={4} height={9} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={10} y={7} width={4} height={14} rx={1} stroke={color} strokeWidth={2} />
      <Rect x={17} y={3} width={4} height={18} rx={1} stroke={color} strokeWidth={2} />
    </Svg>
  )
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path
        d="M4 20c0-4 3.58-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  )
}

// ─── Tab bar label ─────────────────────────────────────────────────────────────

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text
      style={[
        styles.tabLabel,
        { color: focused ? '#ffffff' : Colors.onSurfaceVariant },
      ]}
    >
      {label}
    </Text>
  )
}

// ─── Active tab pill wrapper ──────────────────────────────────────────────────

function TabIcon({
  icon,
  focused,
}: {
  icon: (color: string) => React.ReactNode
  focused: boolean
}) {
  if (focused) {
    return (
      <View style={styles.activePill}>
        {icon('#ffffff')}
      </View>
    )
  }
  return <View style={styles.inactiveIcon}>{icon(Colors.onSurfaceVariant)}</View>
}

// ─── Navigators ───────────────────────────────────────────────────────────────

export type TabParamList = {
  Home: undefined
  Languages: undefined
  Leaderboard: undefined
  Profile: undefined
}

export type RootStackParamList = {
  Tabs: undefined
  Game: { languageId?: string; isDailyChallenge?: boolean; startingWord?: string }
  GameOver: { score: number; chainLength: number; languageId: string }
  DailyChallenge: { languageId?: string }
  LanguagePicker: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()
const Stack = createStackNavigator<RootStackParamList>()

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={(c) => <HomeIcon color={c} />} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="HOME" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Languages"
        component={LanguagePickerScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={(c) => <LanguagesIcon color={c} />} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="LANGUAGES" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={(c) => <LeaderboardIcon color={c} />} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="LEADERBOARD" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon={(c) => <ProfileIcon color={c} />} focused={focused} />
          ),
          tabBarLabel: ({ focused }) => <TabLabel label="PROFILE" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  )
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, cardStyle: { backgroundColor: Colors.background } }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Game" component={GameScreen} />
        <Stack.Screen name="GameOver" component={GameOverScreen} />
        <Stack.Screen name="DailyChallenge" component={DailyChallengeScreen} />
        <Stack.Screen name="LanguagePicker" component={LanguagePickerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'rgba(19,18,27,0.8)',
    borderTopWidth: 0,
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    position: 'absolute',
    elevation: 0,
  },
  activePill: {
    backgroundColor: Colors.primaryContainer,
    borderRadius: 999,
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inactiveIcon: {
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    letterSpacing: 0.5,
    marginTop: 2,
  },
})
