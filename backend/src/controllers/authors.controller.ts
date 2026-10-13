import { Request, Response } from "express";
import { QueryFilter, isValidObjectId } from "mongoose";
import Author, { IAuthorDocument } from "../models/Author";
import Book from "../models/Book";
import { CreateAuthorInput, ListAuthorsInput, UpdateAuthorInput } from "../schemas/author.schema";
import { escapeRegex, isValidationError } from "../utils/mongo";

// QUERY /api/v1/authors
// Body example: { "search": "borges", "nationality": "Argentina", "page": 1, "limit": 20 }
export async function listAuthors(
  req: Request<{}, {}, ListAuthorsInput>,
  res: Response
): Promise<void> {
  const { nationality, search, page, limit, sortBy, sortOrder } = req.body;
  const sortDirection = sortOrder === "asc" ? 1 : -1;

  // Filtro armado solo con campos de la whitelist: nunca se esparce req.body en la query.
  const filter: QueryFilter<IAuthorDocument> = {};
  if (nationality) filter.nationality = nationality;
  if (search) {
    filter.name = { $regex: escapeRegex(search), $options: "i" };
  }

  try {
    const skip = (page - 1) * limit;

    const [authors, total] = await Promise.all([
      Author.find(filter)
        .sort({ [sortBy]: sortDirection })
        .skip(skip)
        .limit(limit),
      Author.countDocuments(filter),
    ]);

    res.status(200).json({
      data: authors,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("[authors] error listing:", error);
    res.status(500).json({ error: "No se pudieron obtener los autores" });
  }
}

export async function getAuthorById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    const author = await Author.findById(id);

    if (!author) {
      res.status(404).json({ error: "Autor no encontrado" });
      return;
    }

    res.status(200).json(author);
  } catch (error) {
    console.error("[authors] error fetching by id:", error);
    res.status(500).json({ error: "No se pudo obtener el autor" });
  }
}

export async function createAuthor(
  req: Request<{}, {}, CreateAuthorInput>,
  res: Response
): Promise<void> {
  try {
    const newAuthor = await Author.create(req.body);
    res.status(201).json(newAuthor);
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[authors] error creating:", error);
    res.status(500).json({ error: "No se pudo crear el autor" });
  }
}

export async function updateAuthor(
  req: Request<{ id: string }, {}, UpdateAuthorInput>,
  res: Response
): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    const updatedAuthor = await Author.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedAuthor) {
      res.status(404).json({ error: "Autor no encontrado" });
      return;
    }

    res.status(200).json(updatedAuthor);
  } catch (error) {
    if (isValidationError(error)) {
      res.status(400).json({ error: error.message });
      return;
    }

    console.error("[authors] error updating:", error);
    res.status(500).json({ error: "No se pudo actualizar el autor" });
  }
}

export async function deleteAuthor(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    res.status(400).json({ error: "El id no es valido" });
    return;
  }

  try {
    // Integridad referencial a mano: Mongo no impide borrar un autor que todavia tiene libros.
    const hasBooks = await Book.exists({ author: id });
    if (hasBooks) {
      res.status(409).json({ error: "No se puede borrar un autor que tiene libros cargados" });
      return;
    }

    const deletedAuthor = await Author.findByIdAndDelete(id);

    if (!deletedAuthor) {
      res.status(404).json({ error: "Autor no encontrado" });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error("[authors] error deleting:", error);
    res.status(500).json({ error: "No se pudo borrar el autor" });
  }
}
