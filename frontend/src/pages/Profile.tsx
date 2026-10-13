// Ruta privada "/perfil": cualquier usuario logueado. ProtectedRoute garantiza que user no es null.
// El backend devuelve solo los prestamos del usuario de la cookie: aunque se manipule el front, no ve los ajenos.
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import { getMyLoans, returnLoan } from "../services/loans";
import type { Loan } from "../types/loan";
import { LoansTable } from "../components/LoansTable";

export const Profile = () => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoans(await getMyLoans());
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  const handleReturn = async (loan: Loan) => {
    setReturningId(loan._id);
    setError(null);
    try {
      const updated = await returnLoan(loan._id);
      setLoans((prev) => prev.map((item) => (item._id === updated._id ? updated : item)));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReturningId(null);
    }
  };

  if (!user) return null;

  const activeCount = loans.filter((loan) => loan.status === "ACTIVE").length;

  return (
    <>
      <section className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">{user.name}</h2>
        <p className="text-slate-600">{user.email}</p>
        <span className="mt-2 inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {user.role}
        </span>
      </section>

      <h3 className="mb-3 text-lg font-semibold text-slate-900">
        Mis préstamos <span className="text-sm font-normal text-slate-500">({activeCount} activos, máximo 3)</span>
      </h3>

      {error && (
        <p role="alert" className="mb-3 text-red-600">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-slate-500">Cargando préstamos...</p>
      ) : loans.length === 0 ? (
        <p className="text-slate-500">
          Todavía no pediste ningún libro.{" "}
          <Link to="/home" className="underline">
            Ir al catálogo
          </Link>
        </p>
      ) : (
        <LoansTable loans={loans} returningId={returningId} onReturn={handleReturn} />
      )}
    </>
  );
};
