import { redirect } from "next/navigation";

/** The studio used to live here; settings moved to /settings. */
export default async function DashboardRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  redirect(tab === "profile" || tab === "settings" ? "/settings" : "/studio");
}
