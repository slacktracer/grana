import type { Operation, Transfer } from "./api.ts";

export const formatCents = (amount: number): string =>
  (amount / 100).toFixed(2);

export const formatOperationRow = (operation: Operation): string => {
  const amount = (operation.amount / 100).toFixed(2).padStart(10);
  const comments = operation.comments || "(no comments)";
  const date = operation.at.slice(0, 16);
  const type = operation.type.padEnd(7);

  return `${date} | ${type} | ${amount} | ${operation.account.name} | ${comments} | ${operation.operationID}`;
};

export const formatTransferLabel = (transfer: Transfer): string => {
  const amount = formatCents(transfer.amount);
  const date = transfer.at.slice(0, 10);
  const from = transfer.fromAccount.name;
  const status = transfer.confirmed ? "" : " (unconfirmed)";
  const to = transfer.toAccount.name;

  return `${from} → ${to} | $${amount} | ${date}${status}`;
};
