import { z } from "zod";

// Un ObjectId de Mongo son 24 caracteres hexadecimales. Validarlo aca evita un CastError en la query.
export const objectIdSchema = z.string().trim().regex(/^[a-f\d]{24}$/i, "El id no es valido");

// Paginacion y orden comunes a todos los listados con QUERY.
export const paginationSchema = {
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
};
