// Mapping between (HTTP method + path) and controller. No business logic here.
// Todo el recurso es privado: router.use(authMiddleware) aplica a cada ruta de abajo.
import { Router } from "express";
import { createLoan, listMyLoans, listLoans, returnLoan } from "../controllers/loans.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validateBody } from "../middlewares/validate";
import { createLoanSchema, listLoansSchema } from "../schemas/loan.schema";

const router = Router();

router.use(authMiddleware);

router.get("/me", listMyLoans);
router.post("/", validateBody(createLoanSchema), createLoan);
router.patch("/:id/return", returnLoan);
router.query!("/", requireRole("ADMIN"), validateBody(listLoansSchema), listLoans);

export default router;
