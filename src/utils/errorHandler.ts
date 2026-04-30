export function captureError(error: unknown, context?: Record<string, unknown>): void {
  console.error('[Error]', error, context)
}

export function captureMessage(message: string, context?: Record<string, unknown>): void {
  console.warn('[Message]', message, context)
}
