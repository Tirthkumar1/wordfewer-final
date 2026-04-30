import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  AdEventType,
  InterstitialAd,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads'
import { Platform } from 'react-native'
import { captureError } from '../utils/errorHandler'
import { isAdFree } from './PurchaseService'

const INTERSTITIAL_COUNT_KEY = 'wordfever_interstitial_count'
const SHOW_EVERY_N = 4

const AD_IDS = {
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        android: 'ca-app-pub-6945189356120937/5218110223',
        ios: 'ca-app-pub-6945189356120937/5218110223',
      })!,
  rewarded: __DEV__
    ? TestIds.REWARDED
    : Platform.select({
        android: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // replace: AdMob rewarded unit ID
        ios: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
      })!,
}

export function initAds(): void {
  // AdMob initializes automatically via the app plugin in app.config.js
}

export async function showInterstitial(): Promise<void> {
  try {
    if (await isAdFree()) return

    const raw = await AsyncStorage.getItem(INTERSTITIAL_COUNT_KEY)
    const count = parseInt(raw ?? '0', 10) + 1
    await AsyncStorage.setItem(INTERSTITIAL_COUNT_KEY, String(count))

    if (count % SHOW_EVERY_N !== 0) return

    await new Promise<void>((resolve, reject) => {
      const ad = InterstitialAd.createForAdRequest(AD_IDS.interstitial, {
        requestNonPersonalizedAdsOnly: true,
      })
      ad.addAdEventListener(AdEventType.LOADED, () => {
        ad.show()
      })
      ad.addAdEventListener(AdEventType.CLOSED, () => resolve())
      ad.addAdEventListener(AdEventType.ERROR, reject)
      ad.load()
    })
  } catch (e) {
    captureError(e, { context: 'showInterstitial' })
  }
}

export async function showRewarded(): Promise<boolean> {
  try {
    if (await isAdFree()) return true

    return await new Promise<boolean>((resolve) => {
      const ad = RewardedAd.createForAdRequest(AD_IDS.rewarded, {
        requestNonPersonalizedAdsOnly: true,
      })
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        ad.show()
      })
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        resolve(true)
      })
      ad.addAdEventListener(AdEventType.CLOSED, () => {
        // resolve false only if reward wasn't earned — handled by EARNED_REWARD above
        resolve(false)
      })
      ad.addAdEventListener(AdEventType.ERROR, () => resolve(false))
      ad.load()
    })
  } catch (e) {
    captureError(e, { context: 'showRewarded' })
    return false
  }
}
