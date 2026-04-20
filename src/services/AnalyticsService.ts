import PostHog from 'posthog-react-native'
import { Env } from '../config/env'
import { captureError } from '../utils/errorHandler'

let client: PostHog | null = null

export function initAnalytics(): void {
  try {
    client = new PostHog(Env.POSTHOG_KEY, {
      host: 'https://eu.i.posthog.com',
    })
  } catch (e) {
    captureError(e, { context: 'initAnalytics' })
  }
}

export function track(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  try {
    client?.capture(event, properties)
  } catch (e) {
    captureError(e, { context: 'track', event })
  }
}

export function identify(deviceId: string): void {
  try {
    client?.identify(deviceId)
  } catch (e) {
    captureError(e, { context: 'identify' })
  }
}

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
