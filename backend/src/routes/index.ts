// Aggregates every v1 resource router. New entities get mounted here, not in server.ts.
import { Router } from "express";
import authRouter from "./auth.routes";
import authorsRouter from "./authors.routes";
import booksRouter from "./books.routes";
import loansRouter from "./loans.routes";

const router = Router();

router.use("/auth", authRouter);
router.use("/authors", authorsRouter);
router.use("/books", booksRouter);
router.use("/loans", loansRouter);

export default router;
