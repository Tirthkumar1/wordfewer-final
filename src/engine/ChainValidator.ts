export class ChainValidator {
  private wordSet: Set<string>
  private chainRule: 'last_letter' | 'last_akshar'

  constructor(wordlist: string[], chainRule: string) {
    this.wordSet = new Set(wordlist.map(w => w.toLowerCase().trim()))
    this.chainRule = chainRule as any
  }

  private graphemeClusters(word: string): string[] {
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
        return [...seg.segment(word)].map(s => s.segment)
      }
    } catch {}
    // Fallback: split on Unicode scalar boundaries for Indic scripts
    return [...word]
  }

  getEndUnit(word: string): string {
    if (this.chainRule === 'last_akshar') {
      const clusters = this.graphemeClusters(word)
      return clusters[clusters.length - 1] ?? ''
    }
    return word[word.length - 1]?.toLowerCase() ?? ''
  }

  getStartUnit(word: string): string {
    if (this.chainRule === 'last_akshar') {
      const clusters = this.graphemeClusters(word)
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
