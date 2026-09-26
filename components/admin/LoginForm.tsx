"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SupabasePasswordAuth = {
  signInWithPassword: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: Error | null }>;
};

export function LoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(
    initialError === "unauthorized"
      ? "Connectez-vous avec un compte administrateur NVD."
      : ""
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setMessage("");

    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey =
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase client unavailable");
      }

      const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
      const auth = supabase.auth as unknown as SupabasePasswordAuth;
      const { error } = await auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        setMessage("Identifiants invalides ou compte non autorisé.");
        setIsLoading(false);
        return;
      }
    } catch (error) {
      console.error(error);
      setMessage("Impossible de vérifier les identifiants pour le moment.");
      setIsLoading(false);
      return;
    }

    router.replace("/admin/dashboard/quotes");
    router.refresh();
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2 text-sm font-semibold">
        Email administrateur
        <span className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@nvd.sn"
            required
          />
        </span>
      </label>

      <label className="grid gap-2 text-sm font-semibold">
        Mot de passe
        <span className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </span>
      </label>

      <Button type="submit" variant="nvd" size="lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="animate-spin" /> : <LockKeyhole />}
        Accéder au dashboard
      </Button>

      {message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
          {message}
        </p>
      )}
    </form>
  );
}
