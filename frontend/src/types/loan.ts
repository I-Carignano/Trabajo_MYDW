// Misma forma que ILoan en el backend (backend/src/models/Loan.ts), con book y user populados.
export type LoanStatus = "ACTIVE" | "RETURNED";

export interface Loan {
  _id: string;
  // null si el libro se borro despues de devuelto (el historial queda).
  book: { _id: string; title: string; isbn: string } | null;
  // GET /loans/me no popula user (es uno mismo); QUERY /loans (admin) si.
  user: string | { _id: string; name: string; email: string } | null;
  loanDate: string;
  dueDate: string;
  returnedAt: string | null;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoanFilters {
  status?: LoanStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "dueDate";
  sortOrder?: "asc" | "desc";
}
