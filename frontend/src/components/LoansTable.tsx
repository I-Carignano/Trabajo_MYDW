// Presentacional: la usan /perfil (prestamos propios) y /admin/prestamos (todos, con columna "Lector").
// No llama a la API: avisa con onReturn y la page decide que hacer.
import { Link } from "react-router";
import { formatDate } from "../lib/format";
import type { Loan } from "../types/loan";
import { LoanStatusBadge } from "./LoanStatusBadge";

interface LoansTableProps {
  loans: Loan[];
  showUser?: boolean;
  returningId: string | null;
  onReturn: (loan: Loan) => void;
}

export const LoansTable = ({ loans, showUser = false, returningId, onReturn }: LoansTableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Libro</th>
            {showUser && <th className="px-4 py-3 font-medium">Lector</th>}
            <th className="px-4 py-3 font-medium">Prestado</th>
            <th className="px-4 py-3 font-medium">Vence</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loans.map((loan) => (
            <tr key={loan._id}>
              <td className="px-4 py-3 text-slate-900">
                {loan.book ? (
                  <Link to={`/books/${loan.book._id}`} className="hover:underline">
                    {loan.book.title}
                  </Link>
                ) : (
                  <span className="text-slate-400">(libro eliminado)</span>
                )}
              </td>
              {showUser && (
                <td className="px-4 py-3 text-slate-700">
                  {loan.user && typeof loan.user === "object" ? (
                    <>
                      {loan.user.name}
                      <span className="block text-xs text-slate-400">{loan.user.email}</span>
                    </>
                  ) : (
                    <span className="text-slate-400">(usuario eliminado)</span>
                  )}
                </td>
              )}
              <td className="px-4 py-3 text-slate-700">{formatDate(loan.loanDate)}</td>
              <td className="px-4 py-3 text-slate-700">
                {loan.returnedAt ? `Devuelto ${formatDate(loan.returnedAt)}` : formatDate(loan.dueDate)}
              </td>
              <td className="px-4 py-3">
                <LoanStatusBadge loan={loan} />
              </td>
              <td className="px-4 py-3 text-right">
                {loan.status === "ACTIVE" && (
                  <button
                    type="button"
                    disabled={returningId === loan._id}
                    onClick={() => onReturn(loan)}
                    className="rounded border border-slate-300 px-3 py-1 text-xs hover:bg-slate-100 disabled:opacity-50"
                  >
                    {returningId === loan._id ? "Registrando..." : showUser ? "Marcar devuelto" : "Devolver"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
