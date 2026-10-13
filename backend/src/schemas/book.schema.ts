import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common.schema";

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

export const ALLOWED_BOOK_SORT_FIELDS = ["createdAt", "title", "publishedYear"] as const;

export const listBooksSchema = z.object({
  ...paginationSchema,
  sortBy: z.enum(ALLOWED_BOOK_SORT_FIELDS).default("createdAt"),
  author: objectIdSchema.optional(),
  genre: z.enum(GENRES).optional(),
  active: z.boolean().optional(),
  // true: solo libros con al menos un ejemplar disponible
  available: z.boolean().optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

// Sin availableCopies: lo calcula el backend a partir de totalCopies y los prestamos activos.
export const createBookSchema = z.object({
  title: z.string().trim().min(1, "El titulo es obligatorio").max(200),
  isbn: z
    .string()
    .trim()
    .regex(/^[\dXx-]{10,17}$/, "El ISBN debe tener entre 10 y 17 caracteres (digitos, guiones o X)"),
  author: objectIdSchema,
  genre: z.enum(GENRES, "El genero no es valido"),
  publishedYear: z.number().int().min(0).max(new Date().getFullYear(), "El año no puede ser futuro"),
  synopsis: z.string().trim().max(2000).optional(),
  totalCopies: z.number().int().min(1, "Tiene que haber al menos 1 ejemplar").max(100),
  active: z.boolean().optional(),
});

export const updateBookSchema = createBookSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Hay que enviar al menos un campo para actualizar" }
);

export type ListBooksInput = z.infer<typeof listBooksSchema>;
export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
