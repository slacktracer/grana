import type { Transfer } from "./api.ts";

export const formatCents = (amount: number): string =>
  (amount / 100).toFixed(2);

export const formatTransferLabel = (transfer: Transfer): string => {
  const amount = formatCents(transfer.amount);
  const date = transfer.at.slice(0, 10);
  const from = transfer.fromAccount.name;
  const status = transfer.confirmed ? "" : " (unconfirmed)";
  const to = transfer.toAccount.name;

  return `${from} → ${to} | $${amount} | ${date}${status}`;
};
