// Layout generico: header con navegacion y sesion. Se monta una sola vez, al navegar solo cambia lo que renderiza <Outlet />.
// Los links privados se esconden segun la sesion/rol (UX); la proteccion real esta en ProtectedRoute y en el backend.
import { Link, NavLink, Outlet, useNavigate } from "react-router";
import { useAuth } from "../auth/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-3 py-1.5 text-sm hover:bg-white/10 ${isActive ? "bg-white/15 font-medium" : ""}`;

export const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/home", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-brand-600 px-6 py-4 text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <Link to="/home" className="text-2xl font-bold">
            Biblioteca
          </Link>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/home" className={navLinkClass}>
              Catálogo
            </NavLink>
            {user && (
              <NavLink to="/perfil" className={navLinkClass}>
                Mis préstamos
              </NavLink>
            )}
            {user?.role === "ADMIN" && (
              <NavLink to="/admin" className={navLinkClass}>
                Administración
              </NavLink>
            )}
            {user ? (
              <button
                type="button"
                onClick={handleLogout}
                className="rounded px-3 py-1.5 text-sm hover:bg-white/10"
              >
                Salir ({user.name})
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Ingresar
              </NavLink>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
};
