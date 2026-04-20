import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const Env = {
  DATABASE_URL: extra.DATABASE_URL as string,
  REVENUECAT_KEY_IOS: extra.REVENUECAT_KEY_IOS as string,
  REVENUECAT_KEY_ANDROID: extra.REVENUECAT_KEY_ANDROID as string,
  SENTRY_DSN: extra.SENTRY_DSN as string,
  POSTHOG_KEY: extra.POSTHOG_KEY as string,
  IS_DEV: __DEV__,
}
