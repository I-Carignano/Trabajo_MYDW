// Page: ruta publica "/books/:id". Cualquiera ve el detalle; pedir prestado exige sesion.
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router";
import { useAuth } from "../auth/useAuth";
import { getErrorMessage } from "../lib/api";
import { formatDate } from "../lib/format";
import { getBookById } from "../services/books";
import { createLoan } from "../services/loans";
import type { Book } from "../types/book";

export const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const location = useLocation();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [loanMessage, setLoanMessage] = useState<string | null>(null);
  const [loanError, setLoanError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const loadBook = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBookById(id);
        setBook(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const handleLoan = async () => {
    if (!book) return;
    setRequesting(true);
    setLoanError(null);
    try {
      const loan = await createLoan(book._id);
      setLoanMessage(`¡Listo! Tenés hasta el ${formatDate(loan.dueDate)} para devolverlo.`);
      setBook({ ...book, availableCopies: book.availableCopies - 1 });
    } catch (err) {
      setLoanError(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return <p className="text-slate-500">Cargando libro...</p>;
  }

  if (error || !book) {
    return (
      <section>
        <p className="text-red-600">No se pudo cargar el libro: {error}</p>
        <Link to="/home" className="mt-2 inline-block text-slate-600 underline">
          Volver al catálogo
        </Link>
      </section>
    );
  }

  const available = book.active && book.availableCopies > 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <Link to="/home" className="text-sm text-slate-500 underline">
        Volver al catálogo
      </Link>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{book.title}</h2>
      <p className="text-slate-600">
        {book.author?.name ?? "Autor desconocido"} · {book.publishedYear}
      </p>

      {book.synopsis && <p className="mt-4 leading-relaxed text-slate-700">{book.synopsis}</p>}

      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        <dt className="text-slate-500">Género</dt>
        <dd className="text-slate-900">{book.genre}</dd>
        <dt className="text-slate-500">ISBN</dt>
        <dd className="text-slate-900">{book.isbn}</dd>
        <dt className="text-slate-500">Ejemplares</dt>
        <dd className={available ? "text-green-600" : "text-slate-400"}>
          {book.availableCopies} de {book.totalCopies} disponibles
        </dd>
      </dl>

      <div className="mt-6 border-t border-slate-100 pt-4">
        {!book.active ? (
          <p className="text-sm text-slate-500">Este libro no está disponible para préstamo.</p>
        ) : !user ? (
          // Ruta publica con una accion privada: mandamos al login y volvemos aca despues (state.from).
          <Link
            to="/login"
            state={{ from: location }}
            className="inline-block rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Ingresá para pedirlo prestado
          </Link>
        ) : loanMessage ? (
          <p role="status" className="text-sm text-green-700">
            {loanMessage}{" "}
            <Link to="/perfil" className="underline">
              Ver mis préstamos
            </Link>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleLoan}
            disabled={!available || requesting}
            className="rounded bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {requesting ? "Pidiendo..." : available ? "Pedir prestado" : "Sin ejemplares disponibles"}
          </button>
        )}
        {loanError && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {loanError}
          </p>
        )}
      </div>

      {book.author?.bio && (
        <aside className="mt-6 rounded-lg bg-brand-50 p-4 text-sm">
          <h3 className="font-medium text-brand-700">Sobre {book.author.name}</h3>
          <p className="mt-1 text-slate-700">{book.author.bio}</p>
        </aside>
      )}
    </section>
  );
};
