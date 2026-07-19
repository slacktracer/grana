import * as p from "@clack/prompts";

import { exitIfCancelled } from "./prompts.ts";

export type DateParts = {
  day: number;
  month: number;
  year: number;
};

export type DateTimeParts = DateParts & {
  hour: number;
  minute: number;
};

export const isValidDateParts = ({ day, month, year }: DateParts): boolean => {
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const sanitizeDateParts = (value: unknown): DateParts | null => {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const { day, month, year } = value as Record<string, unknown>;

  if (
    typeof day === "number" &&
    typeof month === "number" &&
    typeof year === "number"
  ) {
    return { day, month, year };
  }

  return null;
};

export const startOfDayISO = ({ day, month, year }: DateParts): string =>
  new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();

export const endOfDayISO = ({ day, month, year }: DateParts): string =>
  new Date(year, month - 1, day, 23, 59, 59, 999).toISOString();

export const dateTimeISO = ({
  day,
  hour,
  minute,
  month,
  year,
}: DateTimeParts): string =>
  new Date(year, month - 1, day, hour, minute, 0, 0).toISOString();

export type DateTimeSecondsParts = DateTimeParts & {
  second: number;
};

export const dateTimeSecondsISO = ({
  day,
  hour,
  minute,
  month,
  second,
  year,
}: DateTimeSecondsParts): string =>
  new Date(year, month - 1, day, hour, minute, second, 0).toISOString();

const validateYear = (value: string | undefined): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n < 1970 || n > 2100) {
    return "Enter a year between 1970 and 2100";
  }
};

const validateMonth = (value: string | undefined): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n < 1 || n > 12) {
    return "Enter a month between 1 and 12";
  }
};

const validateDay = (value: string | undefined): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n < 1 || n > 31) {
    return "Enter a day between 1 and 31";
  }
};

const validateHour = (value: string | undefined): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n < 0 || n > 23) {
    return "Enter an hour between 0 and 23";
  }
};

const validateMinute = (value: string | undefined): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n < 0 || n > 59) {
    return "Enter a minute between 0 and 59";
  }
};

export const promptDateParts = async ({
  defaults,
  label,
}: {
  defaults: DateParts;
  label: string;
}): Promise<DateParts> => {
  while (true) {
    p.log.message(label);

    const yearStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.year),
        message: "Year",
        placeholder: String(defaults.year),
        validate: validateYear,
      }),
    );

    const monthStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.month),
        message: "Month",
        placeholder: String(defaults.month),
        validate: validateMonth,
      }),
    );

    const dayStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.day),
        message: "Day",
        placeholder: String(defaults.day),
        validate: validateDay,
      }),
    );

    const parts: DateParts = {
      day: parseInt(dayStr, 10),
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
    };

    if (isValidDateParts(parts)) {
      return parts;
    }

    p.log.warn(
      `Invalid date: ${parts.year}-${parts.month}-${parts.day}. Try again.`,
    );
  }
};

export const promptDateTimeParts = async ({
  defaults,
  label,
}: {
  defaults: DateTimeParts;
  label: string;
}): Promise<DateTimeParts> => {
  while (true) {
    p.log.message(label);

    const yearStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.year),
        message: "Year",
        placeholder: String(defaults.year),
        validate: validateYear,
      }),
    );

    const monthStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.month),
        message: "Month",
        placeholder: String(defaults.month),
        validate: validateMonth,
      }),
    );

    const dayStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.day),
        message: "Day",
        placeholder: String(defaults.day),
        validate: validateDay,
      }),
    );

    const hourStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.hour),
        message: "Hour",
        placeholder: String(defaults.hour),
        validate: validateHour,
      }),
    );

    const minuteStr = exitIfCancelled(
      await p.text({
        defaultValue: String(defaults.minute),
        message: "Minute",
        placeholder: String(defaults.minute),
        validate: validateMinute,
      }),
    );

    const parts: DateTimeParts = {
      day: parseInt(dayStr, 10),
      hour: parseInt(hourStr, 10),
      minute: parseInt(minuteStr, 10),
      month: parseInt(monthStr, 10),
      year: parseInt(yearStr, 10),
    };

    if (isValidDateParts(parts)) {
      return parts;
    }

    p.log.warn(
      `Invalid date: ${parts.year}-${parts.month}-${parts.day}. Try again.`,
    );
  }
};
