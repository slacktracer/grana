import type { DateParts } from "./dates.ts";
import { isValidDateParts } from "./dates.ts";

export const parseQuickDate = ({
  defaults,
  value,
}: {
  defaults: DateParts;
  value: string;
}): DateParts | null => {
  const tokens = value.trim().split(/\s+/);

  if (tokens.length !== 3) {
    return null;
  }

  const nums = tokens.map((token, index) =>
    token === "*"
      ? [defaults.year, defaults.month, defaults.day][index]
      : Number(token)
  );

  if (nums.some((n) => !Number.isInteger(n))) {
    return null;
  }

  const [year, month, day] = nums;

  const inRange = year >= 1970 && year <= 2100 &&
    month >= 1 && month <= 12 &&
    day >= 1 && day <= 31;

  if (!inRange || !isValidDateParts({ day, month, year })) {
    return null;
  }

  return { day, month, year };
};

export const validateQuickDate = ({
  defaults,
}: {
  defaults: DateParts;
}): (value: string | undefined) => string | undefined =>
(value) => {
  if (parseQuickDate({ defaults, value: value ?? "" }) === null) {
    return "Enter: year month day (e.g. * * *; * = default)";
  }
};
