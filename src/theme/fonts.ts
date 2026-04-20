export const Fonts = {
  headline: 'PlusJakartaSans-Bold',
  headlineEB: 'PlusJakartaSans-ExtraBold',
  game: 'Nunito-Black',
  gameEB: 'Nunito-ExtraBold',
  body: 'Inter-Regular',
  bodyMedium: 'Inter-Medium',
  notoGujarati: 'NotoSansGujarati-Bold',
  notoDevanagari: 'NotoSansDevanagari-Bold',
} as const

export function getNativeFont(script: string): string {
  if (script === 'gujarati') return Fonts.notoGujarati
  if (script === 'devanagari') return Fonts.notoDevanagari
  return Fonts.game
}
