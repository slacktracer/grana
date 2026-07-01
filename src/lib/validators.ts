export const validateAmount = (
  value: string | undefined,
): string | undefined => {
  const n = parseInt(value ?? "", 10);

  if (isNaN(n) || n <= 0 || String(n) !== (value ?? "").trim()) {
    return "Enter a positive integer in cents (e.g. 10050 for $100.50, 50 for $0.50)";
  }
};
