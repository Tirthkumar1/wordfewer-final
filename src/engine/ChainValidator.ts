// ─── Gujarati ─────────────────────────────────────────────────────────────────

const GU_HALANT = '્'          // ્
const GU_CONSONANTS = new Set([
  'ક','ખ','ગ','ઘ','ઙ',
  'ચ','છ','જ','ઝ','ઞ',
  'ટ','ઠ','ડ','ઢ','ણ',
  'ત','થ','દ','ધ','ન',
  'પ','ફ','બ','ભ','મ',
  'ય','ર','લ','ળ','વ',
  'શ','ષ','સ','હ',
])
const GU_VOWELS = new Set([
  'અ','આ','ઇ','ઈ','ઉ','ઊ','ઋ','એ','ઐ','ઓ','ઔ',
])
// vowel diacritics + anusvara + visarga (things to skip when scanning)
const GU_SKIP = new Set([
  'ા','િ','ી','ુ','ૂ','ૃ','ૄ',
  'ે','ૈ','ો','ૌ',  // ા િ ી ુ ૂ ૃ ૄ ે ૈ ો ૌ
  'ં','ઃ',                     // ં ઃ
])
const GU_CONJUNCTS = ['ક્ષ', 'ત્ર', 'જ્ઞ']

// ─── Devanagari (Hindi) ───────────────────────────────────────────────────────

const HI_HALANT = '्'          // ्
const HI_CONSONANTS = new Set([
  'क','ख','ग','घ','ङ',
  'च','छ','ज','झ','ञ',
  'ट','ठ','ड','ढ','ण',
  'त','थ','द','ध','न',
  'प','फ','ब','भ','म',
  'य','र','ल','व',
  'श','ष','स','ह',
])
const HI_VOWELS = new Set([
  'अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ',
])
const HI_SKIP = new Set([
  'ा','ि','ी','ु','ू','ृ','ॄ',
  'े','ै','ो','ौ',  // ा ि ी ु ू ृ ॄ े ै ो ौ
  'ं','ः',                     // ं ः
])
const HI_CONJUNCTS = ['क्ष', 'त्र', 'ज्ञ']

// ─── Script detection ─────────────────────────────────────────────────────────

type IndicScript = 'gujarati' | 'devanagari'

function detectScript(word: string): IndicScript | null {
  for (const ch of word) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp >= 0x0A80 && cp <= 0x0AFF) return 'gujarati'
    if (cp >= 0x0900 && cp <= 0x097F) return 'devanagari'
  }
  return null
}

// ─── Indic akshar extraction ──────────────────────────────────────────────────

function getIndicUnit(word: string, fromEnd: boolean): string {
  const script = detectScript(word)
  if (!script) return fromEnd
    ? (word[word.length - 1]?.toLowerCase() ?? '')
    : (word[0]?.toLowerCase() ?? '')

  const halant = script === 'gujarati' ? GU_HALANT : HI_HALANT
  const consonants = script === 'gujarati' ? GU_CONSONANTS : HI_CONSONANTS
  const vowels = script === 'gujarati' ? GU_VOWELS : HI_VOWELS
  const skip = script === 'gujarati' ? GU_SKIP : HI_SKIP
  const conjuncts = script === 'gujarati' ? GU_CONJUNCTS : HI_CONJUNCTS

  // Check for special conjuncts first
  if (fromEnd) {
    for (const c of conjuncts) {
      if (word.endsWith(c)) return c
    }
  } else {
    for (const c of conjuncts) {
      if (word.startsWith(c)) return c
    }
  }

  const chars = [...word]  // split into Unicode code points

  if (fromEnd) {
    let i = chars.length - 1
    while (i >= 0) {
      const ch = chars[i]
      if (skip.has(ch)) {
        i--
        continue
      }
      if (ch === halant) {
        // halant at current pos means chars[i-1] is a dead consonant — skip both
        i -= 2
        continue
      }
      if (consonants.has(ch)) {
        // Check if preceded by halant+consonant (= non-special conjunct ending)
        // Fall back to the leading consonant of the conjunct
        if (i >= 2 && chars[i - 1] === halant && consonants.has(chars[i - 2])) {
          return chars[i - 2]
        }
        return ch
      }
      if (vowels.has(ch)) return ch
      i--
    }
    return ''
  } else {
    // from start
    let i = 0
    while (i < chars.length) {
      const ch = chars[i]
      if (consonants.has(ch)) return ch
      if (vowels.has(ch)) return ch
      i++
    }
    return ''
  }
}

// ─── ChainValidator ───────────────────────────────────────────────────────────

export class ChainValidator {
  private wordSet: Set<string>
  private chainRule: 'last_letter' | 'last_akshar'

  constructor(wordlist: string[], chainRule: string) {
    this.wordSet = new Set(wordlist.map(w => w.toLowerCase().trim()))
    this.chainRule = chainRule as any
  }

  getEndUnit(word: string): string {
    if (this.chainRule === 'last_akshar') return getIndicUnit(word, true)
    return word[word.length - 1]?.toLowerCase() ?? ''
  }

  getStartUnit(word: string): string {
    if (this.chainRule === 'last_akshar') return getIndicUnit(word, false)
    return word[0]?.toLowerCase() ?? ''
  }

  isInDictionary(word: string): boolean {
    return this.wordSet.has(word.toLowerCase().trim())
  }

  isValidChain(prevWord: string, nextWord: string): boolean {
    return this.getEndUnit(prevWord) === this.getStartUnit(nextWord)
  }

  isRareLetter(word: string): boolean {
    return /[qxzQXZ]/.test(word)
  }
}
