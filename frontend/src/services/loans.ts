import { api } from "../lib/api";
import type { Paginated } from "../types/book";
import type { Loan, LoanFilters } from "../types/loan";

// Solo se manda el libro: el usuario lo saca el backend de la cookie de sesion.
export const createLoan = async (bookId: string): Promise<Loan> => {
  const { data } = await api.post<Loan>("/loans", { bookId });
  return data;
};

export const getMyLoans = async (): Promise<Loan[]> => {
  const { data } = await api.get<{ data: Loan[] }>("/loans/me");
  return data.data;
};

export const returnLoan = async (id: string): Promise<Loan> => {
  const { data } = await api.patch<Loan>(`/loans/${id}/return`);
  return data;
};

// Solo ADMIN.
export const getAllLoans = async (filters: LoanFilters = {}): Promise<Paginated<Loan>> => {
  const { data } = await api.query<Paginated<Loan>>("/loans", filters);
  return data;
};
