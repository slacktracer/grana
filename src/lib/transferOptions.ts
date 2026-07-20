import type { Transfer } from "./api.ts";
import { formatTransferLabel } from "./format.ts";

export const manualId = "__manual__";
export const loadAll = "__load_all__";

export const buildTransferOptions = ({
  includeLoadAll,
  limit,
  transfers,
}: {
  includeLoadAll: boolean;
  limit: number;
  transfers: Transfer[];
}) => {
  const base = transfers.slice(0, limit).map((t) => ({
    label: formatTransferLabel(t),
    value: t.transferID,
  }));

  const extras = [
    ...(includeLoadAll
      ? [{ label: "Load all transfers...", value: loadAll }]
      : []),
    { label: "Enter transfer ID manually", value: manualId },
  ];

  return [...base, ...extras];
};
