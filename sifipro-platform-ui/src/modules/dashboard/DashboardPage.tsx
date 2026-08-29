import { LogOut } from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import { Button } from "../../components/ui/Button";
import { SurfaceCard } from "../../components/ui/SurfaceCard";

// Stage 1 placeholder. The real tenant-management screen (list/create/activate)
// is built in stage 2, on top of the auth foundation this page confirms works.
export function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Bienvenido{user ? `, ${user.email}` : ""}
        </h1>
        <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
          Sesión de plataforma activa. La gestión de tenants se agrega en la
          siguiente etapa.
        </p>
      </header>

      <SurfaceCard className="p-6 sm:p-8">
        <Button
          variant="secondary"
          leftIcon={<LogOut className="h-3.5 w-3.5" />}
          onClick={logout}
        >
          Cerrar sesión
        </Button>
      </SurfaceCard>
    </section>
  );
}
