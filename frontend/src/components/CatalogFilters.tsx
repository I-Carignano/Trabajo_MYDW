// Presentacional: muestra los filtros y avisa los cambios al padre (Home), que es el dueño del estado.
// La busqueda por texto se aplica al enviar el form (no un request por cada tecla).
import { useState, type SubmitEvent } from "react";
import { GENRES, type Author, type BookFilters, type Genre } from "../types/book";

interface CatalogFiltersProps {
  filters: BookFilters;
  authors: Author[];
  onChange: (changes: Partial<BookFilters>) => void;
}

export const CatalogFilters = ({ filters, authors, onChange }: CatalogFiltersProps) => {
  const [search, setSearch] = useState(filters.search ?? "");

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ search: search.trim() || undefined });
  };

  const fieldClass = "rounded border border-slate-300 bg-white px-3 py-2 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-6 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:flex-wrap md:items-end"
    >
      <label className="flex flex-1 flex-col gap-1 text-sm text-slate-700">
        Buscar por título o ISBN
        <div className="flex gap-2">
          <input
            type="search"
            value={search}
            maxLength={120}
            onChange={(e) => setSearch(e.target.value)}
            className={`${fieldClass} min-w-0 flex-1`}
          />
          <button
            type="submit"
            className="rounded bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            Buscar
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Género
        <select
          value={filters.genre ?? ""}
          onChange={(e) => onChange({ genre: (e.target.value || undefined) as Genre | undefined })}
          className={fieldClass}
        >
          <option value="">Todos</option>
          {GENRES.map((genre) => (
            <option key={genre} value={genre}>
              {genre}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-slate-700">
        Autor
        <select
          value={filters.author ?? ""}
          onChange={(e) => onChange({ author: e.target.value || undefined })}
          className={fieldClass}
        >
          <option value="">Todos</option>
          {authors.map((author) => (
            <option key={author._id} value={author._id}>
              {author.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex items-center gap-2 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={filters.available ?? false}
          onChange={(e) => onChange({ available: e.target.checked || undefined })}
        />
        Solo disponibles
      </label>
    </form>
  );
};
