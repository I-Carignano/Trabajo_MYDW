import { Request, Response } from "express";
import bcrypt from "bcrypt";
import User from "../models/User";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { clearSessionCookies, setSessionCookies } from "../utils/tokens";

export async function registerUser(req: Request<{}, {}, RegisterInput>, res: Response): Promise<void> {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, error: { message: "El email ya esta en uso" } });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ name, email, password: hashedPassword });

    res.status(201).json({
      success: true,
      data: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role },
    });
  } catch (error) {
    console.error("[auth] error registering:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo registrar el usuario" } });
  }
}

export async function login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Mismo mensaje para "no existe" y "password incorrecta": no revelamos que emails estan registrados.
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, error: { message: "Credenciales invalidas" } });
      return;
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      res.status(401).json({ success: false, error: { message: "Credenciales invalidas" } });
      return;
    }

    setSessionCookies(res, user._id.toString(), user.role);

    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("[auth] error logging in:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo iniciar sesion" } });
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  try {
    clearSessionCookies(res);
    res.status(200).json({ success: true, data: { message: "Sesion cerrada" } });
  } catch (error) {
    console.error("[auth] error logging out:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo cerrar la sesion" } });
  }
}

// GET /auth/me: el front no puede leer la cookie httpOnly, asi que pregunta quien es por aca.
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(401).json({ success: false, error: { message: "Sesion invalida" } });
      return;
    }

    res.status(200).json({
      success: true,
      data: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    console.error("[auth] error fetching session:", error);
    res.status(500).json({ success: false, error: { message: "No se pudo obtener la sesion" } });
  }
}
