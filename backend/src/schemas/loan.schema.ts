import { z } from "zod";
import { objectIdSchema, paginationSchema } from "./common.schema";
import { LOAN_STATUSES } from "../models/Loan";

// El usuario NO viaja en el body: sale del JWT (req.userId). Asi nadie pide prestamos a nombre de otro.
export const createLoanSchema = z.object({
  bookId: objectIdSchema,
});

export const ALLOWED_LOAN_SORT_FIELDS = ["createdAt", "dueDate"] as const;

export const listLoansSchema = z.object({
  ...paginationSchema,
  sortBy: z.enum(ALLOWED_LOAN_SORT_FIELDS).default("createdAt"),
  status: z.enum(LOAN_STATUSES).optional(),
  user: objectIdSchema.optional(),
  book: objectIdSchema.optional(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type ListLoansInput = z.infer<typeof listLoansSchema>;
