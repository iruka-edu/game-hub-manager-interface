"use client";

import { useEffect, useMemo } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useSession } from "@/features/auth/hooks/useAuth";

export default function HubSimulatorPage() {
  const { user, isLoading } = useSession();
  const router = useRouter();
  const params = useParams();
  const sp = useSearchParams();

  // Quyền: bạn chỉnh theo ý
  const isQC = user?.roles?.includes("qc");
  const isAdmin = user?.roles?.includes("admin");

  useEffect(() => {
    if (!isLoading && (!user || (!isQC && !isAdmin))) {
      router.replace("/console/qc-inbox");
    }
  }, [isLoading, user, isQC, isAdmin, router]);

  const iframeSrc = useMemo(() => {
    const gameUrl = sp.get("gameUrl") || "";
    const gameId = sp.get("gameId") || "";
    const gameVersion = sp.get("gameVersion") || "";
    const lessonId = sp.get("lessonId") || "";
    const launchToken = sp.get("launchToken") || "";

    const qs = new URLSearchParams({
      gameUrl,
      gameId,
      gameVersion,
      lessonId,
      launchToken,
    });

    // File html đặt trong /public/tools/...
    return `/tools/iruka-gamehub-simulator.html?${qs.toString()}`;
  }, [sp]);

  if (isLoading) return null;
  if (!user || (!isQC && !isAdmin)) return null;

  return (
    <iframe
      src={iframeSrc}
      className="fixed inset-0 w-screen h-screen border-0 bg-black"
      title="Iruka GameHub Simulator"
      allow="microphone; autoplay"
    />
  );
}
