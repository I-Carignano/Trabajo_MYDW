// Mapping between (HTTP method + path) and controller. No business logic here.
// Lectura publica; escritura solo ADMIN.
import { Router } from "express";
import {
  listAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor,
} from "../controllers/authors.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { createAuthorSchema, listAuthorsSchema, updateAuthorSchema } from "../schemas/author.schema";

const router = Router();

router.query!("/", validateBody(listAuthorsSchema), listAuthors);
router.get("/:id", getAuthorById);
router.post("/", authMiddleware, requireRole("ADMIN"), validateBody(createAuthorSchema), createAuthor);
router.put("/:id", authMiddleware, requireRole("ADMIN"), validateBody(updateAuthorSchema), updateAuthor);
router.delete("/:id", authMiddleware, requireRole("ADMIN"), deleteAuthor);

export default router;
