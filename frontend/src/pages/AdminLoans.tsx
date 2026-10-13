// Ruta privada por perfil "/admin/prestamos": solo ADMIN, hereda el guard de su rama (/admin/*).
// Ve los prestamos de todos los usuarios y puede registrar devoluciones.
import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/api";
import { getAllLoans, returnLoan } from "../services/loans";
import type { Paginated } from "../types/book";
import type { Loan, LoanStatus } from "../types/loan";
import { LoansTable } from "../components/LoansTable";
import { Pagination } from "../components/Pagination";

export const AdminLoans = () => {
  const [status, setStatus] = useState<LoanStatus | "">("ACTIVE");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Loan> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadLoans = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllLoans({ status: status || undefined, page, limit: 20 });
        if (!ignore) setResult(data);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadLoans();
    return () => {
      ignore = true;
    };
  }, [status, page]);

  const handleReturn = async (loan: Loan) => {
    setReturningId(loan._id);
    setError(null);
    try {
      const updated = await returnLoan(loan._id);
      // returnLoan no popula user: conservamos el que ya teniamos en la fila.
      setResult((prev) =>
        prev && {
          ...prev,
          data: prev.data.map((item) => (item._id === updated._id ? { ...updated, user: item.user } : item)),
        },
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReturningId(null);
    }
  };

  return (
    <>
      <label className="mb-4 flex items-center gap-2 text-sm text-slate-700">
        Estado
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as LoanStatus | "");
            setPage(1);
          }}
          className="rounded border border-slate-300 bg-white px-3 py-1.5"
        >
          <option value="ACTIVE">Activos</option>
          <option value="RETURNED">Devueltos</option>
          <option value="">Todos</option>
        </select>
      </label>

      {error && (
        <p role="alert" className="mb-3 text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando préstamos...</p>
      ) : result && result.data.length === 0 ? (
        <p className="text-slate-500">No hay préstamos con ese estado.</p>
      ) : (
        result && (
          <>
            <LoansTable loans={result.data} showUser returningId={returningId} onReturn={handleReturn} />
            <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPageChange={setPage} />
          </>
        )
      )}
    </>
  );
};
