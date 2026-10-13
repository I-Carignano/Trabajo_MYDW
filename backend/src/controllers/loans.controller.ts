import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Loan, { ILoanDocument } from "../models/Loan";
import Book from "../models/Book";
import { CreateLoanInput, ListLoansInput } from "../schemas/loan.schema";

const MAX_ACTIVE_LOANS = 3;
const LOAN_DAYS = 14;

// POST /api/v1/loans  (cualquier usuario logueado)
// Body: { "bookId": "..." }. El usuario sale del token, nunca del body.
export async function createLoan(req: Request<{}, {}, CreateLoanInput>, res: Response): Promise<void> {
  const userId = req.userId;
  const { bookId } = req.body;

  try {
    const [activeLoans, alreadyHasBook] = await Promise.all([
      Loan.countDocuments({ user: userId, status: "ACTIVE" }),
      Loan.exists({ user: userId, book: bookId, status: "ACTIVE" }),
    ]);

    if (alreadyHasBook) {
      res.status(409).json({ error: "Ya tenes este libro prestado" });
      return;
    }

    if (activeLoans >= MAX_ACTIVE_LOANS) {
      res.status(409).json({ error: `No podes tener mas de ${MAX_ACTIVE_LOANS} prestamos activos` });
      return;
    }

    // Descuento atomico: solo matchea si el libro esta activo y le queda al menos un ejemplar.
    // Asi dos pedidos simultaneos no pueden llevarse el ultimo ejemplar a la vez.
    const book = await Book.findOneAndUpdate(
      { _id: bookId, active: true, availableCopies: { $gt: 0 } },
      { $inc: { availableCopies: -1 } },
      { returnDocument: "after" }
    );

    if (!book) {
      const exists = await Book.exists({ _id: bookId, active: true });
      if (!exists) {
        res.status(404).json({ error: "Libro no encontrado" });
        return;
      }
      res.status(409).json({ error: "No quedan ejemplares disponibles de este libro" });
      return;
    }

    const dueDate = new Date(Date.now() + LOAN_DAYS * 24 * 60 * 60 * 1000);

    try {
      const loan = await Loan.create({ user: userId, book: bookId, dueDate });
      await loan.populate("book", "title isbn");
      res.status(201).json(loan);
    } catch (error) {
      // Si no se pudo registrar el prestamo, devolvemos el ejemplar que habiamos descontado.
      await Book.updateOne({ _id: bookId }, { $inc: { availableCopies: 1 } });
      throw error;
    }
  } catch (error) {
    console.error("[loans] error creating:", error);
    res.status(500).json({ error: "No se pudo registrar el prestamo" });
  }
}

// GET /api/v1/loans/me  (cualquier usuario logueado): solo los prestamos propios.
export async function listMyLoans(req: Request, res: Response): Promise<void> {
  try {
    const loans = await Loan.find({ user: req.userId })
      .populate("book", "title isbn")
      .sort({ status: 1, dueDate: 1 });

    res.status(200).json({ data: loans });
  } catch (error) {
    console.error("[loans] error listing own loans:", error);
    res.status(500).json({ error: "No se pudieron obtener tus prestamos" });
  }
}

// QUERY /api/v1/loans  (solo ADMIN): todos los prestamos, con filtros.
// Body example: { "status": "ACTIVE", "page": 1, "limit": 20 }
export async function listLoans(req: Request<{}, {}, ListLoansInput>, res: Response): Promise<void> {
  const { status, user, book, page, limit, sortBy, sortOrder } = req.body;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  const filter: QueryFilter<ILoanDocument> = {};
  if (status) filter.status = status;
  if (user) filter.user = user;
  if (book) filter.book = book;

  try {
    const skip = (page - 1) * limit;

    const [loans, total] = await Promise.all([
      Loan.find(filter)
        .populate("book", "title isbn")
        .populate("user", "name email")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit),
      Loan.countDocuments(filter),
    ]);

    res.status(200).json({
      data: loans,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[loans] error listing:", error);
    res.status(500).json({ error: "No se pudieron obtener los prestamos" });
  }
}

// PATCH /api/v1/loans/:id/return  (el dueño del prestamo o un ADMIN)
export async function returnLoan(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  // Un USER solo puede devolver sus propios prestamos: el filtro por user hace que un prestamo
  // ajeno de 404 (no confirmamos que exista). El ADMIN puede registrar cualquier devolucion.
  const filter: QueryFilter<ILoanDocument> = { _id: id };
  if (req.userRole !== "ADMIN") filter.user = req.userId;

  try {
    const loan = await Loan.findOne(filter);

    if (!loan) {
      res.status(404).json({ error: "Prestamo no encontrado" });
      return;
    }

    // Atomico: si dos pedidos de devolucion llegan juntos, solo uno pasa de ACTIVE a RETURNED.
    const returnedLoan = await Loan.findOneAndUpdate(
      { _id: loan._id, status: "ACTIVE" },
      { status: "RETURNED", returnedAt: new Date() },
      { returnDocument: "after" }
    ).populate("book", "title isbn");

    if (!returnedLoan) {
      res.status(409).json({ error: "Este prestamo ya fue devuelto" });
      return;
    }

    await Book.updateOne({ _id: loan.book }, { $inc: { availableCopies: 1 } });

    res.status(200).json(returnedLoan);
  } catch (error) {
    console.error("[loans] error returning:", error);
    res.status(500).json({ error: "No se pudo registrar la devolucion" });
  }
}
