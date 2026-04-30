const wordlists: Record<string, string[]> = {
  en: require('../../language_packs/en/wordlist.json'),
  de: require('../../language_packs/de/wordlist.json'),
  gu: require('../../language_packs/gu/wordlist.json'),
  hi: require('../../language_packs/hi/wordlist.json'),
}

const configs: Record<string, { script: string; chain_rule: string }> = {
  en: require('../../language_packs/en/config.json'),
  de: require('../../language_packs/de/config.json'),
  gu: require('../../language_packs/gu/config.json'),
  hi: require('../../language_packs/hi/config.json'),
}

export function getWordlist(langId: string): string[] {
  const wl = wordlists[langId] ?? wordlists['en']
  return Array.isArray(wl) ? wl : (wl as any).words ?? []
}

export function getLangConfig(langId: string): { script: string; chainRule: string } {
  const cfg = configs[langId] ?? configs['en']
  return { script: cfg.script ?? 'latin', chainRule: cfg.chain_rule ?? 'last_letter' }
}
