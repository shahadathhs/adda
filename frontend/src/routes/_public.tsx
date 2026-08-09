import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/features/site/components/navbar";
import { Footer } from "@/features/site/components/footer";

/**
 * Pathless layout for the public marketing site (navbar + footer + theme).
 * The authenticated app uses its own `_authed` shell; auth pages (login,
 * register) stand alone.
 */
export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
