// Misma forma que IBook / IAuthor en el backend. El JSON no trae tipos: los declaramos a mano.

// Misma lista que GENRES en backend/src/schemas/book.schema.ts.
export const GENRES = [
  "Novela",
  "Cuento",
  "Poesía",
  "Ensayo",
  "Ciencia ficción",
  "Fantasía",
  "Policial",
  "Historia",
  "Biografía",
  "Infantil",
] as const;

export type Genre = (typeof GENRES)[number];

export interface Author {
  _id: string;
  name: string;
  nationality: string;
  birthYear?: number;
  bio: string;
}

export interface Book {
  _id: string;
  title: string;
  isbn: string;
  // El backend hace populate("author"): llega el objeto, no el ObjectId.
  // Si el autor se borro, populate devuelve null.
  author: (Pick<Author, "_id" | "name"> & Partial<Author>) | null;
  genre: Genre;
  publishedYear: number;
  synopsis: string;
  totalCopies: number;
  availableCopies: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Body que acepta QUERY /books (todo opcional: el backend aplica defaults).
export interface BookFilters {
  search?: string;
  genre?: Genre;
  author?: string;
  available?: boolean;
  active?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "title" | "publishedYear";
  sortOrder?: "asc" | "desc";
}

// Envelope de los listados paginados del backend: { data, meta }.
export interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
