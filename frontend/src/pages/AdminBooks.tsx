// Ruta privada por perfil "/admin": solo ADMIN, hereda el guard de su rama (/admin/*).
// Lista todos los libros (activos e inactivos) y permite borrarlos. El alta y la edicion con
// formularios llegan en la Clase 10 (React Hook Form + Zod); la API ya las soporta (POST/PUT /books).
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { getErrorMessage } from "../lib/api";
import { deleteBook, getBooks } from "../services/books";
import type { Book, Paginated } from "../types/book";
import { Pagination } from "../components/Pagination";

export const AdminBooks = () => {
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Book> | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Se incrementa para forzar una recarga (despues de borrar).
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let ignore = false;

    const loadBooks = async () => {
      setLoading(true);
      try {
        const data = await getBooks({ page, limit: 20, sortBy: "title", sortOrder: "asc" });
        if (!ignore) setResult(data);
      } catch (err) {
        if (!ignore) setError(getErrorMessage(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadBooks();
    return () => {
      ignore = true;
    };
  }, [page, reloadKey]);

  const handleDelete = async (book: Book) => {
    if (!window.confirm(`¿Borrar "${book.title}"? Esta acción no se puede deshacer.`)) return;

    setDeletingId(book._id);
    setError(null);
    try {
      await deleteBook(book._id);
      setReloadKey((key) => key + 1);
    } catch (err) {
      // Ej. 409 si el libro tiene prestamos activos.
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {error && (
        <p role="alert" className="mb-3 text-red-600">
          {error}
        </p>
      )}

      {loading && !result ? (
        <p className="text-slate-500">Cargando libros...</p>
      ) : result && result.data.length === 0 ? (
        <p className="text-slate-500">No hay libros cargados. Corré `npm run seed` en el backend.</p>
      ) : (
        result && (
          <>
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Título</th>
                    <th className="px-4 py-3 font-medium">Autor</th>
                    <th className="px-4 py-3 font-medium">Género</th>
                    <th className="px-4 py-3 font-medium">Disponibles</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {result.data.map((book) => (
                    <tr key={book._id}>
                      <td className="px-4 py-3 text-slate-900">
                        <Link to={`/books/${book._id}`} className="hover:underline">
                          {book.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{book.author?.name ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{book.genre}</td>
                      <td className="px-4 py-3 text-slate-700">
                        {book.availableCopies} / {book.totalCopies}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${book.active ? "text-green-600" : "text-slate-400"}`}>
                          {book.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={deletingId === book._id}
                          onClick={() => handleDelete(book)}
                          className="rounded border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === book._id ? "Borrando..." : "Borrar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={result.meta.page} totalPages={result.meta.totalPages} onPageChange={setPage} />
          </>
        )
      )}
    </>
  );
};
