export const validateAmount = (
  value: string | undefined,
): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n <= 0 || String(n) !== (value ?? "").trim()) {
    return "Enter a positive integer in cents (e.g. 10050 for $100.50, 50 for $0.50)";
  }
};

export const validateDate = (value: string | undefined): string | undefined => {
  const d = new Date(value ?? "");

  if (isNaN(d.getTime())) {
    return "Enter a valid date (e.g. 2026-04-01 or 2026-04-01T15:00:00)";
  }
};
