import { describe, expect, it } from 'vitest'
import {
  formatAmount,
  formatInputAmount,
  formatInputDecimal,
  formatMoney,
  formatPercent,
  parseAmount,
  parseDecimal,
  parseRate,
} from './format'

describe('parseAmount', () => {
  it('parses spaced integers', () => {
    expect(parseAmount('3 400 000')).toBe(3400000)
  })

  it('strips non-digits', () => {
    expect(parseAmount('1,234')).toBe(1234)
  })

  it('returns null for empty input', () => {
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('abc')).toBeNull()
  })
})

describe('parseDecimal', () => {
  it('parses Swedish money strings', () => {
    expect(parseDecimal('16 990,00')).toBe(16990)
    expect(parseDecimal('20 046,54')).toBe(20046.54)
  })

  it('accepts dot decimals', () => {
    expect(parseDecimal('9.99')).toBe(9.99)
  })

  it('returns null for blank values', () => {
    expect(parseDecimal('')).toBeNull()
    expect(parseDecimal('   ')).toBeNull()
    expect(parseDecimal('.')).toBeNull()
  })
})

describe('parseRate', () => {
  it('parses percent rates with comma or dot', () => {
    expect(parseRate('9,9900')).toBe(9.99)
    expect(parseRate('0.8325')).toBe(0.8325)
  })
})

describe('formatAmount', () => {
  it('groups thousands with spaces', () => {
    expect(formatAmount(1153000)).toBe('1 153 000')
  })

  it('can include decimals with a dot', () => {
    expect(formatAmount(12.5, 1)).toBe('12.5')
  })
})

describe('formatMoney', () => {
  it('formats Swedish-style money', () => {
    expect(formatMoney(20046.54)).toBe('20 046,54')
    expect(formatMoney(822.92)).toBe('822,92')
  })
})

describe('formatPercent', () => {
  it('formats rates with a percent sign', () => {
    expect(formatPercent(0.8325, 4)).toBe('0,8325%')
  })
})

describe('formatInputAmount', () => {
  it('formats while typing', () => {
    expect(formatInputAmount('3400000')).toBe('3 400 000')
    expect(formatInputAmount('0')).toBe('0')
  })
})

describe('formatInputDecimal', () => {
  it('keeps comma decimals and groups thousands', () => {
    expect(formatInputDecimal('16990,00')).toBe('16 990,00')
    expect(formatInputDecimal('9.9900')).toBe('9,9900')
  })
})
