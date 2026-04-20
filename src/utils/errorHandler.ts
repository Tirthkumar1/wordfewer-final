import * as Sentry from '@sentry/react-native'

export function captureError(error: unknown, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.error('[Error]', error, context)
    return
  }
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context)
      Sentry.captureException(error)
    })
  } else {
    Sentry.captureException(error)
  }
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  if (__DEV__) {
    console.warn('[Message]', message, context)
    return
  }
  if (context) {
    Sentry.withScope((scope) => {
      scope.setExtras(context)
      Sentry.captureMessage(message)
    })
  } else {
    Sentry.captureMessage(message)
  }
}
