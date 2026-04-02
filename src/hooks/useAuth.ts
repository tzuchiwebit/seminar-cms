"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import pb from "@/lib/pb";

export function useAuth(requireAuth = true) {
  const router = useRouter();
  const [user, setUser] = useState(pb.authStore.record);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = pb.authStore.onChange((_token, record) => {
      setUser(record);
    });

    if (requireAuth && !pb.authStore.isValid) {
      router.replace("/admin/login");
    }
    setLoading(false);

    return () => unsub();
  }, [requireAuth, router]);

  const signOut = () => {
    pb.authStore.clear();
    router.replace("/admin/login");
  };

  return { user, loading, isValid: pb.authStore.isValid, signOut };
}
