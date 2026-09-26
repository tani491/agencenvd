"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

type SupabaseLogoutAuth = {
  signOut: () => Promise<{ error: Error | null }>;
};

export function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogout() {
    setIsLoading(true);
    const supabase = createClient();
    const auth = supabase.auth as unknown as SupabaseLogoutAuth;
    await auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={isLoading}>
      <LogOut />
      Déconnexion
    </Button>
  );
}
