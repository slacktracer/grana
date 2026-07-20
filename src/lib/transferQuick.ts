import type { DateTimeSecondsParts } from "./dates.ts";
import { isValidDateParts } from "./dates.ts";

export type QuickTransfer = DateTimeSecondsParts & {
  amount: number;
};

export const parseQuickTransfer = (value: string): QuickTransfer | null => {
  const parts = value.trim().split(/\s+/);

  if (parts.length !== 7) {
    return null;
  }

  const nums = parts.map((x) => Number(x));

  if (nums.some((n) => !Number.isInteger(n))) {
    return null;
  }

  const [amount, year, month, day, hour, minute, second] = nums;
  const parsed: QuickTransfer = {
    amount,
    day,
    hour,
    minute,
    month,
    second,
    year,
  };

  const inRange = amount > 0 &&
    year >= 1970 && year <= 2100 &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31 &&
    hour >= 0 && hour <= 23 &&
    minute >= 0 && minute <= 59 &&
    second >= 0 && second <= 59;

  if (!inRange || !isValidDateParts(parsed)) {
    return null;
  }

  return parsed;
};

export const validateQuickTransfer = (
  value: string | undefined,
): string | undefined => {
  if (parseQuickTransfer(value ?? "") === null) {
    return "Enter: value year month day hour minute second (e.g. 1494071 2026 7 17 21 53 0)";
  }
};
