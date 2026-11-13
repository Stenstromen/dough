export function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[^\d]/g, '')
  if (!cleaned) return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export function parseDecimal(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const normalized = trimmed.replace(/\s/g, '').replace(',', '.')
  if (!normalized || normalized === '.') return null
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? value : null
}

export function parseRate(raw: string): number | null {
  return parseDecimal(raw)
}

export function formatAmount(value: number, decimals = 0): string {
  const fixed = value.toFixed(decimals)
  const [intPart, fracPart] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return decimals > 0 ? `${grouped}.${fracPart}` : grouped
}

/** Swedish-style money: 20 046,54 */
export function formatMoney(value: number, decimals = 2): string {
  const fixed = value.toFixed(decimals)
  const [intPart, fracPart] = fixed.split('.')
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  return decimals > 0 ? `${grouped},${fracPart}` : grouped
}

export function formatPercent(value: number, decimals = 4): string {
  return `${formatMoney(value, decimals)}%`
}

export function formatInputAmount(raw: string): string {
  const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  if (!digits) return ''
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatInputRate(raw: string): string {
  return formatInputDecimal(raw)
}

/** Allows "16 990,00" style typing while editing. */
export function formatInputDecimal(raw: string): string {
  const normalized = raw.replace('.', ',')
  let cleaned = ''
  let seenComma = false

  for (const char of normalized) {
    if (/\d/.test(char)) {
      cleaned += char
      continue
    }
    if (char === ',' && !seenComma) {
      cleaned += ','
      seenComma = true
      continue
    }
    if (/\s/.test(char)) {
      cleaned += ' '
    }
  }

  const commaIndex = cleaned.indexOf(',')
  const intRaw = commaIndex === -1 ? cleaned : cleaned.slice(0, commaIndex)
  const fracRaw = commaIndex === -1 ? null : cleaned.slice(commaIndex + 1)
  const intDigits = intRaw.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  const grouped = intDigits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

  if (fracRaw === null) return grouped
  return `${grouped},${fracRaw.replace(/\D/g, '')}`
}
