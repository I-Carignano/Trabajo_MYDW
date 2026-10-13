import { isOverdue } from "../lib/format";
import type { Loan } from "../types/loan";

export const LoanStatusBadge = ({ loan }: { loan: Loan }) => {
  if (loan.status === "RETURNED") {
    return <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">Devuelto</span>;
  }

  if (isOverdue(loan)) {
    return <span className="rounded bg-red-50 px-2 py-0.5 text-xs text-red-700">Vencido</span>;
  }

  return <span className="rounded bg-green-50 px-2 py-0.5 text-xs text-green-700">Activo</span>;
};
