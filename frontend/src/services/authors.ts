import { api } from "../lib/api";
import type { Author, Paginated } from "../types/book";

// Para el selector de autores del catalogo: los trae todos ordenados por nombre.
export const getAuthors = async (): Promise<Author[]> => {
  const { data } = await api.query<Paginated<Author>>("/authors", {
    sortBy: "name",
    sortOrder: "asc",
    limit: 100,
  });
  return data.data;
};
