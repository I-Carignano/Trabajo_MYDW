// Page: ruta publica "/home" (el catalogo). Es la dueña del estado de los filtros; los components solo muestran.
import { useEffect, useState } from "react";
import { getErrorMessage } from "../lib/api";
import { getBooks } from "../services/books";
import { getAuthors } from "../services/authors";
import type { Author, Book, BookFilters, Paginated } from "../types/book";
import { BookCard } from "../components/BookCard";
import { CatalogFilters } from "../components/CatalogFilters";
import { Pagination } from "../components/Pagination";

const INITIAL_FILTERS: BookFilters = {
  active: true,
  sortBy: "title",
  sortOrder: "asc",
  page: 1,
  limit: 12,
};

export const Home = () => {
  const [filters, setFilters] = useState<BookFilters>(INITIAL_FILTERS);
  const [result, setResult] = useState<Paginated<Book> | null>(null);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Los autores son solo para el selector: si fallan, el catalogo igual funciona.
  useEffect(() => {
    const loadAuthors = async () => {
      try {
        setAuthors(await getAuthors());
      } catch {
        setAuthors([]);
      }
    };

    loadAuthors();
  }, []);

  // Se vuelve a pedir cada vez que cambian los filtros. `ignore` descarta la respuesta de un request
  // viejo si el usuario cambio el filtro antes de que llegara (evita mostrar resultados desfasados).
  useEffect(() => {
    let ignore = false;

    const loadBooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBooks(filters);
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
  }, [filters]);

  // Cualquier filtro nuevo vuelve a la pagina 1.
  const handleFiltersChange = (changes: Partial<BookFilters>) => {
    setFilters((prev) => ({ ...prev, ...changes, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  return (
    <>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Catálogo</h2>
      <CatalogFilters filters={filters} authors={authors} onChange={handleFiltersChange} />

      {loading && <p className="text-slate-500">Cargando libros...</p>}

      {!loading && error && (
        <p className="text-red-600">No se pudieron cargar los libros: {error}</p>
      )}

      {!loading && !error && result && result.data.length === 0 && (
        <p className="text-slate-500">No hay libros que coincidan con la búsqueda.</p>
      )}

      {!loading && !error && result && result.data.length > 0 && (
        <>
          <p className="mb-3 text-sm text-slate-500">{result.meta.total} libro(s) encontrados</p>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {result.data.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </section>
          <Pagination
            page={result.meta.page}
            totalPages={result.meta.totalPages}
            onPageChange={handlePageChange}
          />
        </>
      )}
    </>
  );
};
