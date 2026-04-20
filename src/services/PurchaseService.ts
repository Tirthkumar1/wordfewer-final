import Purchases, { type PurchasesPackage } from 'react-native-purchases'
import { Platform } from 'react-native'
import { Env } from '../config/env'
import { captureError } from '../utils/errorHandler'

let _adFreeCache: boolean | null = null

export function init(): void {
  const key = Platform.select({
    ios: Env.REVENUECAT_KEY_IOS,
    android: Env.REVENUECAT_KEY_ANDROID,
  })
  if (!key) return
  Purchases.configure({ apiKey: key })
}

export async function getProducts(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings()
    return offerings.current?.availablePackages ?? []
  } catch (e) {
    captureError(e, { context: 'getProducts' })
    return []
  }
}

export async function purchaseRemoveAds(): Promise<boolean> {
  try {
    const packages = await getProducts()
    const pkg = packages.find(p => p.identifier.includes('remove_ads'))
    if (!pkg) return false
    await Purchases.purchasePackage(pkg)
    _adFreeCache = true
    return true
  } catch (e) {
    captureError(e, { context: 'purchaseRemoveAds' })
    return false
  }
}

export async function purchaseAllLanguages(): Promise<boolean> {
  try {
    const packages = await getProducts()
    const pkg = packages.find(p => p.identifier.includes('all_languages'))
    if (!pkg) return false
    await Purchases.purchasePackage(pkg)
    return true
  } catch (e) {
    captureError(e, { context: 'purchaseAllLanguages' })
    return false
  }
}

export async function restorePurchases(): Promise<void> {
  try {
    await Purchases.restorePurchases()
    _adFreeCache = null
  } catch (e) {
    captureError(e, { context: 'restorePurchases' })
  }
}

export async function isAdFree(): Promise<boolean> {
  if (_adFreeCache !== null) return _adFreeCache
  try {
    const info = await Purchases.getCustomerInfo()
    const active = info.entitlements.active['remove_ads']
    _adFreeCache = !!active
    return _adFreeCache
  } catch (e) {
    captureError(e, { context: 'isAdFree' })
    return false
  }
}
