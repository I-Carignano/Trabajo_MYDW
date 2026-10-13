import type { Loan } from "../types/loan";

export const formatDate = (iso: string): string => new Date(iso).toLocaleDateString("es-AR");

// "Vencido" no se guarda en la base: es un prestamo activo cuya fecha de devolucion ya paso.
export const isOverdue = (loan: Loan): boolean =>
  loan.status === "ACTIVE" && new Date(loan.dueDate).getTime() < Date.now();
