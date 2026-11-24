export type ReportPeriod = "day" | "week" | "month" | "year";

export type ReportSelection = {
  period: ReportPeriod;
  /** YYYY-MM-DD — used by day and week */
  date?: string | null;
  /** YYYY-MM — used by month */
  month?: string | null;
  /** YYYY — used by year */
  year?: number | null;
};

const pad = (value: number) => value.toString().padStart(2, "0");

export const toDateInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const toMonthInputValue = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseMonth(value?: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const month = Number(match[2]) - 1;
  if (month < 0 || month > 11) return null;
  const date = new Date(Number(match[1]), month, 1);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** The date anchoring the selected period (defaults to today). */
export function resolveBaseDate(selection: ReportSelection): Date {
  const now = new Date();
  switch (selection.period) {
    case "day":
    case "week":
      return parseDate(selection.date) ?? now;
    case "month":
      return parseMonth(selection.month) ?? now;
    case "year": {
      const year = Number(selection.year);
      return Number.isInteger(year) && year >= 1900 && year <= 2100
        ? new Date(year, 0, 1)
        : now;
    }
  }
}

/** Inclusive start, exclusive end. */
export function getReportRange(selection: ReportSelection) {
  const base = resolveBaseDate(selection);

  switch (selection.period) {
    case "day": {
      const start = startOfDay(base);
      return { start, end: addDays(start, 1) };
    }
    case "week": {
      const end = addDays(startOfDay(base), 1);
      return { start: addDays(startOfDay(base), -6), end };
    }
    case "month": {
      const year = base.getFullYear();
      const month = base.getMonth();
      return {
        start: new Date(year, month, 1),
        end: new Date(year, month + 1, 1),
      };
    }
    case "year": {
      const year = base.getFullYear();
      return { start: new Date(year, 0, 1), end: new Date(year + 1, 0, 1) };
    }
  }
}

/** The equivalent window immediately before the selected one. */
export function getPreviousReportRange(selection: ReportSelection) {
  const { start } = getReportRange(selection);
  const year = start.getFullYear();
  const month = start.getMonth();

  switch (selection.period) {
    case "day":
      return { start: addDays(start, -1), end: start };
    case "week":
      return { start: addDays(start, -7), end: start };
    case "month":
      return {
        start: new Date(year, month - 1, 1),
        end: new Date(year, month, 1),
      };
    case "year":
      return { start: new Date(year - 1, 0, 1), end: new Date(year, 0, 1) };
  }
}

export function formatPeriod(date: Date, period: ReportPeriod) {
  switch (period) {
    case "day":
      return date.getHours().toString().padStart(2, "0");
    case "week": {
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      return `${date.getDate()}-${dayName}`;
    }
    case "month":
      return date.getDate().toString();
    case "year": {
      const monthName = date.toLocaleDateString("en-US", { month: "long" });
      return `${date.getFullYear()}-${monthName}`;
    }
  }
}

export function generatePeriods(selection: ReportSelection) {
  const { start } = getReportRange(selection);

  switch (selection.period) {
    case "day":
      return Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0"));
    case "week":
      return Array.from({ length: 7 }, (_, i) =>
        formatPeriod(addDays(start, i), "week"),
      );
    case "month": {
      const days = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate();
      return Array.from({ length: days }, (_, i) => (i + 1).toString());
    }
    case "year":
      return Array.from({ length: 12 }, (_, i) =>
        formatPeriod(new Date(start.getFullYear(), i, 1), "year"),
      );
  }
}
