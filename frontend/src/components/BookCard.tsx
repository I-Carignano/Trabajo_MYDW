// Presentacional: recibe un libro por props, no sabe nada de axios ni de estado.
// Toda la card es un <Link>: click en cualquier parte navega al detalle (/books/:id).
import { Link } from "react-router";
import type { Book } from "../types/book";

interface BookCardProps {
  book: Book;
}

export const BookCard = ({ book }: BookCardProps) => {
  const available = book.availableCopies > 0;

  return (
    <Link
      to={`/books/${book._id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:outline-none"
    >
      <article>
        <div className="mb-2 flex items-center justify-between">
          <span className="rounded bg-brand-50 px-2 py-0.5 text-xs text-brand-700">{book.genre}</span>
          <span className={`text-xs ${available ? "text-green-600" : "text-slate-400"}`}>
            {available ? `${book.availableCopies} disponible(s)` : "Sin ejemplares"}
          </span>
        </div>
        <h3 className="text-lg font-semibold text-slate-900">{book.title}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {book.author?.name ?? "Autor desconocido"} · {book.publishedYear}
        </p>
        <p className="mt-3 text-xs text-slate-400">Ver detalle →</p>
      </article>
    </Link>
  );
};
