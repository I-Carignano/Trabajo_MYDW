import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Book, { IBookDocument } from "../models/Book";
import Author from "../models/Author";
import Loan from "../models/Loan";
import { CreateBookInput, ListBooksInput, UpdateBookInput } from "../schemas/book.schema";
import { escapeRegex, isDuplicateKeyError, isValidationError } from "../utils/mongo";

// QUERY /api/v1/books
// Body example: { "genre": "Novela", "available": true, "search": "ficciones", "page": 1, "limit": 12 }
export async function listBooks(req: Request<{}, {}, ListBooksInput>, res: Response): Promise<void> {
  const { author, genre, active, available, search, page, limit, sortBy, sortOrder } = req.body;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Filtro armado solo con campos de la whitelist: nunca se esparce req.body en la query
  // (eso permitiria inyectar operadores como { "$gt": "" } en cualquier campo).
  const filter: QueryFilter<IBookDocument> = {};
  if (author) filter.author = author;
  if (genre) filter.genre = genre;
  if (active !== undefined) filter.active = active;
  if (available) filter.availableCopies = { $gt: 0 };
  if (search) {
    const safeSearch = escapeRegex(search);
    filter.$or = [
      { title: { $regex: safeSearch, $options: "i" } },
      { isbn: { $regex: safeSearch, $options: "i" } },
    ];
  }

  try {
    const skip = (page - 1) * limit;

    const [books, total] = await Promise.all([
      Book.find(filter)
        .populate("author", "name")
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit),
      Book.countDocuments(filter),
    ]);

    res.status(200).json({
      data: books,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[books] error listing:", error);
    res.status(500).json({ error: "No se pudieron obtener los libros" });
  }
}

export async function getBookById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    const book = await Book.findById(id).populate("author", "name nationality birthYear bio");

    if (!book) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }

    res.status(200).json(book);
  } catch (error) {
    console.error("[books] error fetching by id:", error);
    res.status(500).json({ error: "No se pudo obtener el libro" });
  }
}

export async function createBook(req: Request<{}, {}, CreateBookInput>, res: Response): Promise<void> {
  try {
    const authorExists = await Author.exists({ _id: req.body.author });
    if (!authorExists) {
      res.status(400).json({ error: "El autor indicado no existe" });
      return;
    }

    // Un libro nuevo no tiene prestamos: todos sus ejemplares arrancan disponibles.
    const newBook = await Book.create({ ...req.body, availableCopies: req.body.totalCopies });
    res.status(201).json(newBook);
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "Ya existe un libro con ese ISBN" });
      return;
    }

    console.error("[books] error creating:", error);
    res.status(500).json({ error: "No se pudo crear el libro" });
  }
}

export async function updateBook(
  req: Request<{ id: string }, {}, UpdateBookInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  const { totalCopies, ...fields } = req.body;

  try {
    const book = await Book.findById(id);
    if (!book) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }

    if (fields.author && !(await Author.exists({ _id: fields.author }))) {
      res.status(400).json({ error: "El autor indicado no existe" });
      return;
    }

    // Cambiar totalCopies mueve availableCopies en la misma cantidad (los prestados no cambian).
    // El filtro hace la operacion atomica: si en el medio se presto un ejemplar y ya no alcanza, no matchea.
    const delta = totalCopies !== undefined ? totalCopies - book.totalCopies : 0;
    const filter: QueryFilter<IBookDocument> = { _id: id, totalCopies: book.totalCopies };
    if (delta < 0) filter.availableCopies = { $gte: -delta };

    const updatedBook = await Book.findOneAndUpdate(
      filter,
      { $set: fields, $inc: { totalCopies: delta, availableCopies: delta } },
      { returnDocument: "after", runValidators: true }
    );

    if (!updatedBook) {
      res.status(409).json({ error: "No se puede dejar menos ejemplares que los que estan prestados" });
      return;
    }

    res.status(200).json(updatedBook);
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (isDuplicateKeyError(error)) {
      res.status(409).json({ error: "Ya existe un libro con ese ISBN" });
      return;
    }

    console.error("[books] error updating:", error);
    res.status(500).json({ error: "No se pudo actualizar el libro" });
  }
}

export async function deleteBook(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    const hasActiveLoans = await Loan.exists({ book: id, status: "ACTIVE" });
    if (hasActiveLoans) {
      res.status(409).json({ error: "No se puede borrar un libro con prestamos activos" });
      return;
    }

    const deletedBook = await Book.findByIdAndDelete(id);

    if (!deletedBook) {
      res.status(404).json({ error: "Libro no encontrado" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[books] error deleting:", error);
    res.status(500).json({ error: "No se pudo borrar el libro" });
  }
}
