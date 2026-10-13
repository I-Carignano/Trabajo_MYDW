import { z } from "zod";
import { paginationSchema } from "./common.schema";

export const ALLOWED_AUTHOR_SORT_FIELDS = ["createdAt", "name"] as const;

export const listAuthorsSchema = z.object({
  ...paginationSchema,
  sortBy: z.enum(ALLOWED_AUTHOR_SORT_FIELDS).default("name"),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
  nationality: z.string().trim().min(1).optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export const createAuthorSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio").max(120),
  nationality: z.string().trim().max(60).optional(),
  birthYear: z.number().int().min(0).max(new Date().getFullYear()).optional(),
  bio: z.string().trim().max(1000).optional(),
});

export const updateAuthorSchema = createAuthorSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Hay que enviar al menos un campo para actualizar" }
);

export type ListAuthorsInput = z.infer<typeof listAuthorsSchema>;
export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
