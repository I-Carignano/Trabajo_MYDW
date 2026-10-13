import { Schema, model, Document, Model, Types } from "mongoose";

export interface IAuthor {
  name: string;
  nationality: string;
  birthYear?: number;
  bio: string;
}

export interface IAuthorDocument extends IAuthor, Document {
  _id: Types.ObjectId;
}

const authorSchema = new Schema<IAuthorDocument>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [120, "Name cannot exceed 120 characters"],
    },
    nationality: {
      type: String,
      trim: true,
      default: "",
      maxlength: [60, "Nationality cannot exceed 60 characters"],
    },
    birthYear: {
      type: Number,
      min: [0, "Birth year must be positive"],
    },
    bio: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Bio cannot exceed 1000 characters"],
    },
  },
  {
    timestamps: true,
  }
);

const Author: Model<IAuthorDocument> = model<IAuthorDocument>("Author", authorSchema);

export default Author;
