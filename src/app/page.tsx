import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("iruka_session")?.value;

  if (token) {
    const session = verifySession(token);
    if (session) {
      redirect("/console");
    }
  }

  redirect("/login");
}
