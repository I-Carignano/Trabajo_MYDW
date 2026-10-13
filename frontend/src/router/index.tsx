// Arbol de rutas centralizado (data router). Tres niveles de acceso: publico, privado y privado por perfil.
import { createBrowserRouter, redirect } from "react-router";
import { Layout } from "../layouts/Layout";
import { AdminLayout } from "../layouts/AdminLayout";
import { ProtectedRoute } from "./ProtectedRoute";
import { Home } from "../pages/Home";
import { BookDetail } from "../pages/BookDetail";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { Profile } from "../pages/Profile";
import { AdminBooks } from "../pages/AdminBooks";
import { AdminLoans } from "../pages/AdminLoans";
import { NotFound } from "../pages/NotFound";

export const router = createBrowserRouter([
  // Fuera del Layout: pantalla completa, sin header
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },

  {
    path: "/",
    element: <Layout />,
    children: [
      // Redireccion fija: el loader corre antes de renderizar. El catalogo es publico, asi que es la portada.
      { index: true, loader: () => redirect("/home") },

      // Publicas
      { path: "home", element: <Home /> },
      { path: "books/:id", element: <BookDetail /> },

      // Privada: cualquier usuario logueado
      {
        element: <ProtectedRoute />,
        children: [{ path: "perfil", element: <Profile /> }],
      },

      // Privada por perfil: solo ADMIN
      {
        element: <ProtectedRoute roles={["ADMIN"]} />,
        children: [
          {
            path: "admin",
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminBooks /> },
              { path: "prestamos", element: <AdminLoans /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
