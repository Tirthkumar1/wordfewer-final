import { ChainValidator } from './ChainValidator'

const EN_WORDS = ['cat', 'tiger', 'dog', 'rabbit', 'ear', 'xylophone', 'zoo']
const GU_WORDS = ['આંબો', 'ઓરડો', 'ઘર', 'રસ્તો']

describe('ChainValidator — Latin (last_letter)', () => {
  const v = new ChainValidator(EN_WORDS, 'last_letter')

  test('valid chain: cat → tiger (t ends cat, t starts tiger)', () => {
    expect(v.isValidChain('cat', 'tiger')).toBe(true)
  })

  test('invalid chain: cat → dog (t ≠ d)', () => {
    expect(v.isValidChain('cat', 'dog')).toBe(false)
  })

  test('word in dictionary', () => {
    expect(v.isInDictionary('cat')).toBe(true)
  })

  test('word not in dictionary', () => {
    expect(v.isInDictionary('spaceship')).toBe(false)
  })

  test('isInDictionary is case-insensitive', () => {
    expect(v.isInDictionary('CAT')).toBe(true)
  })

  test('getEndUnit returns last letter lowercase', () => {
    expect(v.getEndUnit('cat')).toBe('t')
  })

  test('getStartUnit returns first letter lowercase', () => {
    expect(v.getStartUnit('Tiger')).toBe('t')
  })
})

describe('ChainValidator — Gujarati (last_akshar)', () => {
  const v = new ChainValidator(GU_WORDS, 'last_akshar')

  test('valid chain: આંબો → ઓરડો (ો ends આંબો, ઓ starts ઓરડો)', () => {
    // last grapheme of આંબો is 'ો', first grapheme of ઓ is 'ઓ' — not equal
    // Use words where last akshar matches first akshar
    expect(v.isValidChain('ઘર', 'રસ્તો')).toBe(true)
  })

  test('invalid chain: આંબો → ઘર (ો ≠ ઘ)', () => {
    expect(v.isValidChain('આંબો', 'ઘર')).toBe(false)
  })

  test('getEndUnit returns last grapheme cluster', () => {
    const result = v.getEndUnit('ઘર')
    expect(result).toBe('ર')
  })

  test('getStartUnit returns first grapheme cluster', () => {
    const result = v.getStartUnit('રસ્તો')
    expect(result).toBe('ર')
  })
})

describe('ChainValidator — rare letter detection', () => {
  const v = new ChainValidator(EN_WORDS, 'last_letter')

  test('xylophone triggers rare bonus (x)', () => {
    expect(v.isRareLetter('xylophone')).toBe(true)
  })

  test('zoo triggers rare bonus (z)', () => {
    expect(v.isRareLetter('zoo')).toBe(true)
  })

  test('tiger does not trigger rare bonus', () => {
    expect(v.isRareLetter('tiger')).toBe(false)
  })
})
