import type { DateTimeSecondsParts } from "./dates.ts";
import { isValidDateParts } from "./dates.ts";

export type QuickTransfer = DateTimeSecondsParts & {
  amount: number;
};

export const parseQuickTransferAt = ({
  now,
  value,
}: {
  now: Date;
  value: string;
}): QuickTransfer | null => {
  const parts = value.trim().split(/\s+/);

  if (parts.length !== 6 && parts.length !== 7) {
    return null;
  }

  const amount = Number(parts[0]);

  if (!Number.isInteger(amount) || amount <= 0) {
    return null;
  }

  const dateTokens = parts.length === 6
    ? [...parts.slice(1), "0"]
    : parts.slice(1);

  const current = [
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate(),
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
  ];

  const nums = dateTokens.map((token, index) =>
    token === "*" ? current[index] : Number(token)
  );

  if (nums.some((n) => !Number.isInteger(n))) {
    return null;
  }

  const [year, month, day, hour, minute, second] = nums;

  const parsed: QuickTransfer = {
    amount,
    day,
    hour,
    minute,
    month,
    second,
    year,
  };

  const inRange = year >= 1970 && year <= 2100 &&
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

export const parseQuickTransfer = (value: string): QuickTransfer | null =>
  parseQuickTransferAt({ now: new Date(), value });

export const validateQuickTransfer = (
  value: string | undefined,
): string | undefined => {
  if (parseQuickTransfer(value ?? "") === null) {
    return "Enter: value year month day hour minute [second] (e.g. 1494071 * 7 17 21 53; * = now)";
  }
};
