export function init(): void {}

export async function getProducts(): Promise<unknown[]> {
  return []
}

export async function purchaseRemoveAds(): Promise<boolean> {
  console.log('IAP stub: purchaseRemoveAds')
  return false
}

export async function purchaseAllLanguages(): Promise<boolean> {
  console.log('IAP stub: purchaseAllLanguages')
  return false
}

export async function restorePurchases(): Promise<void> {
  console.log('IAP stub: restorePurchases')
}

export async function isAdFree(): Promise<boolean> {
  return false
}
