export type AnalyticsEvent =
  | 'app_opened'
  | 'language_selected'
  | 'game_started'
  | 'game_over'
  | 'word_submitted'
  | 'rewarded_ad_watched'
  | 'interstitial_shown'
  | 'iap_started'
  | 'iap_completed'
  | 'score_shared'

export function initAnalytics(): void {}

export function track(_event: AnalyticsEvent, _properties?: Record<string, unknown>): void {}

export function identify(_deviceId: string): void {}
