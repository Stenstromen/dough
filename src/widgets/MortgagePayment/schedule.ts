export interface LoanPartInput {
  id: string
  name: string
  balance: number
  annualRate: number
  amortize: boolean
  monthlyAmortization: number
}

export interface PartMonthBreakdown {
  id: string
  name: string
  openingBalance: number
  interest: number
  amortization: number
  payment: number
  closingBalance: number
}

export interface ScheduleMonth {
  monthIndex: number
  label: string
  parts: PartMonthBreakdown[]
  totalInterest: number
  totalAmortization: number
  totalPayment: number
}

function monthLabel(from: Date, offset: number): string {
  const date = new Date(from.getFullYear(), from.getMonth() + offset, 1)
  return date.toLocaleDateString(undefined, {
    month: 'short',
    year: 'numeric',
  })
}

function projectMonth(
  parts: LoanPartInput[],
  balances: number[],
): PartMonthBreakdown[] {
  return parts.map((part, index) => {
    const openingBalance = balances[index]
    const interest = openingBalance * (part.annualRate / 100) / 12
    const requested =
      part.amortize && openingBalance > 0 ? part.monthlyAmortization : 0
    const amortization = Math.min(requested, openingBalance)
    const payment = interest + amortization
    const closingBalance = Math.max(0, openingBalance - amortization)

    return {
      id: part.id,
      name: part.name,
      openingBalance,
      interest,
      amortization,
      payment,
      closingBalance,
    }
  })
}

export function buildSchedule(
  parts: LoanPartInput[],
  months = 12,
  from = new Date(),
): ScheduleMonth[] {
  const balances = parts.map((part) => part.balance)
  const schedule: ScheduleMonth[] = []

  for (let monthIndex = 0; monthIndex < months; monthIndex += 1) {
    const breakdown = projectMonth(parts, balances)
    for (let i = 0; i < breakdown.length; i += 1) {
      balances[i] = breakdown[i].closingBalance
    }

    schedule.push({
      monthIndex,
      label: monthLabel(from, monthIndex),
      parts: breakdown,
      totalInterest: breakdown.reduce((sum, part) => sum + part.interest, 0),
      totalAmortization: breakdown.reduce(
        (sum, part) => sum + part.amortization,
        0,
      ),
      totalPayment: breakdown.reduce((sum, part) => sum + part.payment, 0),
    })
  }

  return schedule
}
