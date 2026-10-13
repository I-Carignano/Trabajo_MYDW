import { api } from "../lib/api";
import type { Book, BookFilters, Paginated } from "../types/book";

// El listado usa el metodo QUERY (filtros en el body). axios lo soporta nativo: api.query(url, body).
export const getBooks = async (filters: BookFilters = {}): Promise<Paginated<Book>> => {
  const { data } = await api.query<Paginated<Book>>("/books", filters);
  return data;
};

// GET /books/:id devuelve el libro sin envelope (400 si el id es invalido, 404 si no existe).
export const getBookById = async (id: string): Promise<Book> => {
  const { data } = await api.get<Book>(`/books/${id}`);
  return data;
};

// Solo ADMIN: el backend responde 403 a cualquier otro rol.
export const deleteBook = async (id: string): Promise<void> => {
  await api.delete(`/books/${id}`);
};
