"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function OnlinePageRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const room = searchParams?.get("room");

  useEffect(() => {
    if (room) {
      router.replace(`/games/treasure-hunt/online/${room.toUpperCase()}`);
    } else {
      router.replace("/games/treasure-hunt");
    }
  }, [room, router]);

  return null;
}

export default function OnlinePage() {
  return (
    <Suspense fallback={null}>
      <OnlinePageRedirect />
    </Suspense>
  );
}
