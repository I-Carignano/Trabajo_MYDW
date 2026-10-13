// Mapping between (HTTP method + path) and controller. No business logic here.
// Lectura publica (catalogo); escritura solo ADMIN. El orden importa: primero auth, despues rol,
// despues validacion (no tiene sentido validar el body de alguien que no puede hacer la accion).
import { Router } from "express";
import {
  listBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook,
} from "../controllers/books.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { createBookSchema, listBooksSchema, updateBookSchema } from "../schemas/book.schema";

const router = Router();

router.query!("/", validateBody(listBooksSchema), listBooks);
router.get("/:id", getBookById);
router.post("/", authMiddleware, requireRole("ADMIN"), validateBody(createBookSchema), createBook);
router.put("/:id", authMiddleware, requireRole("ADMIN"), validateBody(updateBookSchema), updateBook);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteBook);

export default router;
