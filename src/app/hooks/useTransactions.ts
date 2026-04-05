import { useMemo } from "react";
import type { Transaction } from "../services/browserUseService";

export function useTransactions() {
  return useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("piggy_transactions") || "[]") as Transaction[];
    } catch {
      return [];
    }
  }, []);
}
