export function stripEmailQuote(text: string): string {
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('>')) {
      const cutAt = (i > 0 && /napsal|wrote/i.test(lines[i - 1])) ? i - 1 : i
      return lines.slice(0, cutAt).join('\n').trim()
    }
  }
  return text.trim()
}
