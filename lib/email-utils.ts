export function stripEmailQuote(text: string): string {
  const lines = text.split('\n')

  // Strategie 1: první řádek začínající ">" (klasický formát citace)
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trimStart().startsWith('>')) {
      const cutAt = (i > 0 && /napsal|wrote/i.test(lines[i - 1])) ? i - 1 : i
      return lines.slice(0, cutAt).join('\n').trim()
    }
  }

  // Strategie 2: řádek "odesílatel/odesilatel ... <email@domain>"
  const senderRe = /odes[ií]latel.*<[^>]+@[^>]+>/i
  for (let i = 0; i < lines.length; i++) {
    if (senderRe.test(lines[i])) {
      return lines.slice(0, i).join('\n').trim()
    }
  }

  // Strategie 3: řádek končící "wrote:" nebo "napsal:" (anglický/český fallback)
  const quoteIntroRe = /^.*\b(wrote|napsal)\s*:?\s*$/i
  for (let i = 0; i < lines.length; i++) {
    if (quoteIntroRe.test(lines[i].trim())) {
      return lines.slice(0, i).join('\n').trim()
    }
  }

  return text.trim()
}
