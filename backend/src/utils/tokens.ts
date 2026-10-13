// Unica fuente de verdad para firmar tokens y armar las cookies de sesion.
// La usan auth.controller (login/logout) y auth.middleware (renovacion con el refreshToken).
import { CookieOptions, Response } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "../types/auth.types";

const ACCESS_TOKEN_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function getAccessSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET environment variable");
  return secret;
}

export function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error("Missing JWT_REFRESH_SECRET environment variable");
  return secret;
}

// httpOnly: JS del navegador no puede leerla (protege contra XSS).
// secure: solo viaja por HTTPS en produccion. sameSite lax: no se manda en POST cross-site (CSRF).
function baseCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  };
}

export function setAccessCookie(res: Response, userId: string, role: UserRole): void {
  const accessToken = jwt.sign({ userId, role }, getAccessSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m",
  } as jwt.SignOptions);

  res.cookie("accessToken", accessToken, { ...baseCookieOptions(), maxAge: ACCESS_TOKEN_MAX_AGE_MS });
}

export function setSessionCookies(res: Response, userId: string, role: UserRole): void {
  setAccessCookie(res, userId, role);

  const refreshToken = jwt.sign({ userId, role }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
  } as jwt.SignOptions);

  res.cookie("refreshToken", refreshToken, { ...baseCookieOptions(), maxAge: REFRESH_TOKEN_MAX_AGE_MS });
}

// clearCookie tiene que recibir las mismas opciones con las que se creo la cookie para borrarla.
export function clearSessionCookies(res: Response): void {
  res.clearCookie("accessToken", baseCookieOptions());
  res.clearCookie("refreshToken", baseCookieOptions());
}
