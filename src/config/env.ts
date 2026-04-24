import Constants from 'expo-constants'

const extra = Constants.expoConfig?.extra ?? {}

export const Env = {
  DATABASE_URL: extra.DATABASE_URL as string,
  IS_DEV: __DEV__,
}
