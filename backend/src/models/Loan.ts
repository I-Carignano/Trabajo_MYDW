import { Schema, model, Document, Model, Types } from "mongoose";

export const LOAN_STATUSES = ["ACTIVE", "RETURNED"] as const;
export type LoanStatus = (typeof LOAN_STATUSES)[number];

export interface ILoan {
  user: Types.ObjectId;
  book: Types.ObjectId;
  loanDate: Date;
  dueDate: Date;
  returnedAt: Date | null;
  status: LoanStatus;
}

export interface ILoanDocument extends ILoan, Document {
  _id: Types.ObjectId;
}

const loanSchema = new Schema<ILoanDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: "Book",
      required: [true, "Book is required"],
    },
    loanDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: [true, "Due date is required"],
    },
    returnedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: LOAN_STATUSES,
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

// Las consultas mas comunes son "prestamos activos de un usuario" y "prestamos activos de un libro".
loanSchema.index({ user: 1, status: 1 });
loanSchema.index({ book: 1, status: 1 });

const Loan: Model<ILoanDocument> = model<ILoanDocument>("Loan", loanSchema);

export default Loan;
