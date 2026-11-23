export function formatCount(count: number) {
  return count.toLocaleString('en-US')
}

export function formatDuration(elapsedMs: number) {
  return elapsedMs < 1000
    ? `${Math.round(elapsedMs)}ms`
    : `${(elapsedMs / 1000).toFixed(2)}s`
}
