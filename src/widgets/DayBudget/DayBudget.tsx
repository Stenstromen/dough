import { useMemo } from "react";
import {
  Button,
  DateField,
  Field,
  Metric,
  ResultPanel,
  Stack,
  Stat,
  StatGroup,
  Surface,
  Text,
  WidgetFrame,
} from "../../components";
import {
  defaultPayday,
  isOnOrBefore,
  parseDateInput,
  startOfDay,
  toDateInputValue,
} from "../../lib/dates";
import { formatAmount, formatInputAmount, parseAmount } from "../../lib/format";
import { usePersistedState } from "../../lib/usePersistedState";
import { adjustSum, calculateDayBudget } from "./calculate";
import "./DayBudget.css";

interface ExpenseDraft {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
}

interface DayBudgetState {
  sumRaw: string;
  startDate: string;
  payday: string;
  expenses: ExpenseDraft[];
  nextExpenseNumber: number;
}

const POSITIVE_DELTAS = [1000, 100, 10, 1] as const;
const NEGATIVE_DELTAS = [-1000, -100, -10, -1] as const;

const INITIAL_STATE: DayBudgetState = {
  sumRaw: "",
  startDate: toDateInputValue(new Date()),
  payday: toDateInputValue(defaultPayday()),
  expenses: [],
  nextExpenseNumber: 1,
};

function isExpenseDraft(value: unknown): value is ExpenseDraft {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.name === "string" &&
    typeof record.amount === "string" &&
    (typeof record.dueDate === "string" || record.dueDate === undefined)
  );
}

function normalizeExpense(value: ExpenseDraft): ExpenseDraft {
  return {
    ...value,
    dueDate: value.dueDate ?? "",
  };
}

function isDayBudgetState(value: unknown): value is DayBudgetState {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sumRaw === "string" &&
    typeof record.startDate === "string" &&
    typeof record.payday === "string" &&
    Array.isArray(record.expenses) &&
    record.expenses.every(isExpenseDraft) &&
    typeof record.nextExpenseNumber === "number"
  );
}

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : String(delta);
}

function isDueOrPast(dueDateRaw: string, reference: Date): boolean {
  const dueDate = parseDateInput(dueDateRaw);
  if (!dueDate) return false;
  return isOnOrBefore(dueDate, reference);
}

function compareExpensesByDueDate(a: ExpenseDraft, b: ExpenseDraft): number {
  const aDue = parseDateInput(a.dueDate);
  const bDue = parseDateInput(b.dueDate);
  if (!aDue && !bDue) return 0;
  if (!aDue) return -1;
  if (!bDue) return 1;
  return aDue.getTime() - bDue.getTime();
}

export function DayBudget() {
  const [state, setState] = usePersistedState(
    "dough:day-budget",
    INITIAL_STATE,
    isDayBudgetState,
  );

  const today = startOfDay(new Date());
  const expenses = state.expenses
    .map(normalizeExpense)
    .sort(compareExpensesByDueDate);

  const result = useMemo(() => {
    const sum = parseAmount(state.sumRaw);
    const start = parseDateInput(state.startDate);
    const payday = parseDateInput(state.payday);
    if (sum === null || start === null || payday === null) {
      return null;
    }

    return calculateDayBudget({
      sum,
      startDate: start,
      payday,
      referenceDate: today,
      expenses: state.expenses.map(normalizeExpense).flatMap((expense) => {
        const amount = parseAmount(expense.amount);
        if (amount === null || amount <= 0) return [];
        return [
          {
            id: expense.id,
            name: expense.name.trim() || "Expense",
            amount,
            dueDate: parseDateInput(expense.dueDate),
          },
        ];
      }),
    });
  }, [state, today]);

  function setSumFromNumber(next: number) {
    setState((current) => ({
      ...current,
      sumRaw: next === 0 ? "" : formatInputAmount(String(Math.round(next))),
    }));
  }

  function applyDelta(delta: number) {
    const current = parseAmount(state.sumRaw) ?? 0;
    setSumFromNumber(adjustSum(current, delta));
  }

  function addExpense() {
    setState((current) => ({
      ...current,
      nextExpenseNumber: current.nextExpenseNumber + 1,
      expenses: [
        {
          id: `expense-${current.nextExpenseNumber}`,
          name: "",
          amount: "",
          dueDate: "",
        },
        ...current.expenses.map(normalizeExpense),
      ],
    }));
  }

  function updateExpense(id: string, patch: Partial<ExpenseDraft>) {
    setState((current) => ({
      ...current,
      expenses: current.expenses.map((expense) =>
        expense.id === id
          ? normalizeExpense({ ...normalizeExpense(expense), ...patch })
          : normalizeExpense(expense),
      ),
    }));
  }

  function removeExpense(id: string) {
    setState((current) => ({
      ...current,
      expenses: current.expenses
        .filter((expense) => expense.id !== id)
        .map(normalizeExpense),
    }));
  }

  return (
    <WidgetFrame
      title="Day budget"
      description="Divide what's left until payday by the remaining days. Subtract upcoming known expenses first, then spend the daily amount."
    >
      <Stack gap="lg">
        <Field
          label="Available sum"
          inputMode="numeric"
          autoComplete="off"
          inputSize="lg"
          placeholder="8 000"
          value={state.sumRaw}
          onChange={(event) =>
            setState((current) => ({
              ...current,
              sumRaw: formatInputAmount(event.target.value),
            }))
          }
        />

        <div
          className="day-budget__deltas"
          role="group"
          aria-label="Quick sum update"
        >
          <div className="day-budget__delta-row" aria-label="Increase sum">
            {POSITIVE_DELTAS.map((delta) => (
              <Button
                key={delta}
                className="day-budget__delta"
                variant="accent"
                onClick={() => applyDelta(delta)}
              >
                {formatDelta(delta)}
              </Button>
            ))}
          </div>
          <div className="day-budget__delta-row" aria-label="Decrease sum">
            {NEGATIVE_DELTAS.map((delta) => (
              <Button
                key={delta}
                className="day-budget__delta"
                variant="ghost"
                onClick={() => applyDelta(delta)}
              >
                {formatDelta(delta)}
              </Button>
            ))}
          </div>
        </div>

        <Stack gap="md" columns="form-2" className="day-budget__dates">
          <div className="day-budget__date-field">
            <DateField
              label="From date"
              value={state.startDate}
              onChange={(startDate) =>
                setState((current) => ({
                  ...current,
                  startDate,
                }))
              }
            />
            <Button
              className="day-budget__today"
              variant="accent"
              onClick={() =>
                setState((current) => ({
                  ...current,
                  startDate: toDateInputValue(new Date()),
                }))
              }
            >
              Today
            </Button>
          </div>

          <DateField
            label="Payday"
            value={state.payday}
            onChange={(payday) =>
              setState((current) => ({
                ...current,
                payday,
              }))
            }
          />
        </Stack>
      </Stack>

      <ResultPanel
        ready={result !== null}
        placeholder="Enter an available sum and payday to see your daily budget."
      >
        {result ? (
          <>
            <Metric
              label="Daily budget"
              value={formatAmount(Math.round(result.dailyBudget))}
            />

            <StatGroup>
              <Stat
                label="Days remaining"
                value={String(result.daysRemaining)}
              />
              <Stat
                label="After expenses"
                value={formatAmount(Math.round(result.available))}
              />
              <Stat
                label="Upcoming expenses"
                value={formatAmount(Math.round(result.upcomingExpenseTotal))}
              />
            </StatGroup>

            {result.dueExpenseCount > 0 ? (
              <Text variant="meta" className="day-budget__due-summary">
                {result.dueExpenseCount} due expense
                {result.dueExpenseCount === 1 ? "" : "s"} totaling{" "}
                {formatAmount(Math.round(result.dueExpenseTotal))}{" "}
                {result.dueExpenseCount === 1 ? "is" : "are"} highlighted and
                left out of the daily calculation — adjust the available sum
                first.
              </Text>
            ) : null}

            {result.paydayIsPast ? (
              <Text variant="meta">
                Payday is before the from date — showing a one-day budget until
                you pick a future payday.
              </Text>
            ) : (
              <Text variant="meta">
                {formatAmount(Math.round(result.available))} left over{" "}
                {result.daysRemaining} day
                {result.daysRemaining === 1 ? "" : "s"} until payday
                {result.upcomingExpenseTotal > 0
                  ? `, after ${formatAmount(Math.round(result.upcomingExpenseTotal))} in upcoming expenses`
                  : ""}
                .
              </Text>
            )}
          </>
        ) : null}
      </ResultPanel>
      <Stack gap="md">
        <div className="day-budget__expenses-head">
          <Text variant="section">Known expenses</Text>
          <Button variant="accent" onClick={addExpense}>
            Add expense
          </Button>
        </div>

        {expenses.length === 0 ? (
          <Text variant="meta">
            Add bills or set-asides with an optional due date. Due or past
            expenses light up so you can deduct them from the available sum
            instead of leaving them in the daily plan.
          </Text>
        ) : (
          <Stack gap="sm">
            {expenses.map((expense, index) => {
              const due = isDueOrPast(expense.dueDate, today);
              return (
                <Surface
                  as="section"
                  key={expense.id}
                  variant="panel"
                  className={
                    due
                      ? "day-budget__expense day-budget__expense--due"
                      : "day-budget__expense"
                  }
                >
                  <div className="day-budget__expense-row">
                    <Field
                      grow
                      clearable={false}
                      className="day-budget__expense-name"
                      label="Name"
                      autoComplete="off"
                      placeholder={`Expense ${index + 1}`}
                      value={expense.name}
                      onChange={(event) =>
                        updateExpense(expense.id, { name: event.target.value })
                      }
                    />
                    <Field
                      clearable={false}
                      className="day-budget__expense-amount"
                      label="Amount"
                      inputMode="numeric"
                      autoComplete="off"
                      placeholder="500"
                      value={expense.amount}
                      onChange={(event) =>
                        updateExpense(expense.id, {
                          amount: formatInputAmount(event.target.value),
                        })
                      }
                    />
                    <Button
                      variant="danger"
                      className="day-budget__remove"
                      aria-label={`Remove ${expense.name.trim() || `expense ${index + 1}`}`}
                      onClick={() => removeExpense(expense.id)}
                    >
                      ×
                    </Button>
                  </div>

                  <DateField
                    clearable
                    className="day-budget__expense-due"
                    label="Due (optional)"
                    value={expense.dueDate}
                    onChange={(dueDate) =>
                      updateExpense(expense.id, { dueDate })
                    }
                  />

                  {due ? (
                    <Text variant="meta" className="day-budget__due-note">
                      Due or past — deduct from available sum, then clear or
                      remove.
                    </Text>
                  ) : null}
                </Surface>
              );
            })}
          </Stack>
        )}
      </Stack>
    </WidgetFrame>
  );
}
