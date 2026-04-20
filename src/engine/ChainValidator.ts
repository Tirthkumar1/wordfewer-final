export class ChainValidator {
  private wordSet: Set<string>
  private chainRule: 'last_letter' | 'last_akshar'

  constructor(wordlist: string[], chainRule: string) {
    this.wordSet = new Set(wordlist.map(w => w.toLowerCase().trim()))
    this.chainRule = chainRule as any
  }

  getEndUnit(word: string): string {
    if (this.chainRule === 'last_akshar') {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      const clusters = [...seg.segment(word)].map(s => s.segment)
      return clusters[clusters.length - 1] ?? ''
    }
    return word[word.length - 1]?.toLowerCase() ?? ''
  }

  getStartUnit(word: string): string {
    if (this.chainRule === 'last_akshar') {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
      const clusters = [...seg.segment(word)].map(s => s.segment)
      return clusters[0] ?? ''
    }
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
