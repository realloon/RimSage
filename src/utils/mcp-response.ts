export function textResponse(text: string) {
  return {
    content: [{ type: 'text' as const, text }],
  }
}
