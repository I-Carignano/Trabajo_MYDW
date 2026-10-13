import { Schema, model, Document, Model, Types } from "mongoose";

export interface IBook {
  title: string;
  isbn: string;
  author: Types.ObjectId;
  genre: string;
  publishedYear: number;
  synopsis: string;
  totalCopies: number;
  // Lo maneja el backend (alta de libro, prestamos y devoluciones): el cliente nunca lo manda.
  availableCopies: number;
  active: boolean;
}

export interface IBookDocument extends IBook, Document {
  _id: Types.ObjectId;
}

const bookSchema = new Schema<IBookDocument>(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    isbn: {
      type: String,
      required: [true, "ISBN is required"],
      trim: true,
      unique: true,
      maxlength: [17, "ISBN cannot exceed 17 characters"],
    },
    // Referencia a Author: con .populate("author") se reemplaza el ObjectId por el documento.
    author: {
      type: Schema.Types.ObjectId,
      ref: "Author",
      required: [true, "Author is required"],
    },
    genre: {
      type: String,
      required: [true, "Genre is required"],
      trim: true,
    },
    publishedYear: {
      type: Number,
      required: [true, "Published year is required"],
      min: [0, "Published year must be positive"],
    },
    synopsis: {
      type: String,
      trim: true,
      default: "",
      maxlength: [2000, "Synopsis cannot exceed 2000 characters"],
    },
    totalCopies: {
      type: Number,
      required: [true, "Total copies are required"],
      min: [1, "There must be at least 1 copy"],
    },
    availableCopies: {
      type: Number,
      required: true,
      min: [0, "Available copies cannot be negative"],
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Book: Model<IBookDocument> = model<IBookDocument>("Book", bookSchema);

export default Book;
