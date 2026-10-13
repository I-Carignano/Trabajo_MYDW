// Layout anidado del panel admin: pestañas fijas arriba y la sub-pagina en el <Outlet />.
// Vive dentro de <ProtectedRoute roles={["ADMIN"]} />: cuando se renderiza, el usuario ya es ADMIN.
import { NavLink, Outlet } from "react-router";

const tabClass = ({ isActive }: { isActive: boolean }) =>
  `border-b-2 px-4 py-2 text-sm ${
    isActive
      ? "border-brand-600 font-medium text-brand-700"
      : "border-transparent text-slate-500 hover:text-slate-800"
  }`;

export const AdminLayout = () => {
  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold text-slate-900">Panel de administración</h2>
      <nav className="mb-6 flex gap-2 border-b border-slate-200">
        {/* end: sin esto "/admin" quedaria activo tambien en "/admin/prestamos" */}
        <NavLink to="/admin" end className={tabClass}>
          Libros
        </NavLink>
        <NavLink to="/admin/prestamos" className={tabClass}>
          Préstamos
        </NavLink>
      </nav>
      <Outlet />
    </section>
  );
};
