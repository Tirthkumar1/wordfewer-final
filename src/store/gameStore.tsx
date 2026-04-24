import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
} from 'react'
import { ChainValidator } from '../engine/ChainValidator'

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = 'idle' | 'playing' | 'paused' | 'gameover'

interface GameState {
  status: Status
  languageId: string
  script: string
  chainRule: string
  currentWord: string
  requiredUnit: string
  chain: string[]
  score: number
  timeRemaining: number
  baseTime: number
  wordCount: number
  personalBest: { chain: number; score: number }
  sessionStartTime: number
  invalidAttempt: boolean
  lastBonus: 'rare' | 'milestone' | null
  wordlist: string[]
}

type Action =
  | { type: 'SET_LANGUAGE'; payload: { languageId: string; script: string; chainRule: string; wordlist: string[] } }
  | { type: 'START_GAME'; payload?: string }
  | { type: 'SUBMIT_WORD'; payload: string }
  | { type: 'TICK' }
  | { type: 'EXPIRE' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'FREEZE_TIMER'; payload: number }
  | { type: 'RESET' }

// ─── Initial state ────────────────────────────────────────────────────────────

const INITIAL_STATE: GameState = {
  status: 'idle',
  languageId: 'en',
  script: 'latin',
  chainRule: 'last_letter',
  currentWord: '',
  requiredUnit: '',
  chain: [],
  score: 0,
  timeRemaining: 10,
  baseTime: 10,
  wordCount: 0,
  personalBest: { chain: 0, score: 0 },
  sessionStartTime: 0,
  invalidAttempt: false,
  lastBonus: null,
  wordlist: [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeValidator(state: GameState): ChainValidator {
  return new ChainValidator(state.wordlist, state.chainRule)
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return {
        ...state,
        languageId: action.payload.languageId,
        script: action.payload.script,
        chainRule: action.payload.chainRule,
        wordlist: action.payload.wordlist,
      }

    case 'START_GAME': {
      const validator = makeValidator(state)
      const startWord = action.payload ?? pickRandom(state.wordlist)
      return {
        ...state,
        status: 'playing',
        chain: [startWord],
        currentWord: startWord,
        requiredUnit: validator.getEndUnit(startWord),
        score: 0,
        wordCount: 1,
        baseTime: 10,
        timeRemaining: 10,
        sessionStartTime: Date.now(),
        invalidAttempt: false,
        lastBonus: null,
      }
    }

    case 'SUBMIT_WORD': {
      if (state.status !== 'playing') return state
      const word = action.payload.trim()
      const validator = makeValidator(state)

      if (!validator.isInDictionary(word) || !validator.isValidChain(state.currentWord, word)) {
        return { ...state, invalidAttempt: true, lastBonus: null }
      }

      let bonus = 0
      let lastBonus: GameState['lastBonus'] = null
      const newChain = [...state.chain, word]
      let newScore = state.score + word.length * 10

      if (validator.isRareLetter(word)) {
        newScore += 60
        lastBonus = 'rare'
      }

      if (newChain.length % 10 === 0) {
        newScore += 100
        lastBonus = 'milestone'
      }

      const newWordCount = state.wordCount + 1
      const newBaseTime = newWordCount % 5 === 0
        ? Math.max(5, state.baseTime - 0.5)
        : state.baseTime

      return {
        ...state,
        chain: newChain,
        currentWord: word,
        requiredUnit: validator.getEndUnit(word),
        score: newScore,
        wordCount: newWordCount,
        baseTime: newBaseTime,
        timeRemaining: newBaseTime,
        invalidAttempt: false,
        lastBonus,
      }
    }

    case 'TICK':
      if (state.status !== 'playing') return state
      return { ...state, timeRemaining: Math.max(0, state.timeRemaining - 1) }

    case 'EXPIRE': {
      const newBest = {
        chain: Math.max(state.personalBest.chain, state.chain.length),
        score: Math.max(state.personalBest.score, state.score),
      }
      return { ...state, status: 'gameover', personalBest: newBest }
    }

    case 'PAUSE':
      return state.status === 'playing' ? { ...state, status: 'paused' } : state

    case 'RESUME':
      return state.status === 'paused' ? { ...state, status: 'playing' } : state

    case 'FREEZE_TIMER':
      return { ...state, timeRemaining: state.timeRemaining + action.payload }

    case 'RESET':
      return { ...INITIAL_STATE, personalBest: state.personalBest }

    default:
      return state
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface GameContextValue {
  state: GameState
  dispatch: React.Dispatch<Action>
}

const GameContext = createContext<GameContextValue | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE)
  const value = useMemo(() => ({ state, dispatch }), [state])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame must be used inside GameProvider')
  return ctx
}

export function useValidator(): ChainValidator {
  const { state } = useGame()
  return useMemo(
    () => new ChainValidator(state.wordlist, state.chainRule),
    [state.wordlist, state.chainRule],
  )
}
