// Protege rutas: exige un accessToken valido en cookies; si expiro, intenta renovarlo con el refreshToken.
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JwtAccessPayload, JwtRefreshPayload, UserRole } from "../types/auth.types";
import { getAccessSecret, getRefreshSecret, setAccessCookie } from "../utils/tokens";

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const accessToken = req.cookies?.accessToken;

  if (!accessToken) {
    renewFromRefreshToken(req, res, next);
    return;
  }

  try {
    const decoded = jwt.verify(accessToken, getAccessSecret()) as JwtAccessPayload;
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    renewFromRefreshToken(req, res, next);
  }
}

// requireRole: siempre se usa DESPUES de authMiddleware, asume que req.userRole ya esta seteado.
export function requireRole(...rolesPermitidos: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.userRole) {
      res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
      return;
    }

    if (!rolesPermitidos.includes(req.userRole)) {
      res.status(403).json({ success: false, error: { message: "No tenes permisos para realizar esta accion" } });
      return;
    }

    next();
  };
}

function renewFromRefreshToken(req: Request, res: Response, next: NextFunction): void {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(401).json({ success: false, error: { message: "Sesion requerida" } });
    return;
  }

  try {
    const decoded = jwt.verify(refreshToken, getRefreshSecret()) as JwtRefreshPayload;

    setAccessCookie(res, decoded.userId, decoded.role);

    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    res.status(401).json({ success: false, error: { message: "Sesion invalida o expirada" } });
  }
}
