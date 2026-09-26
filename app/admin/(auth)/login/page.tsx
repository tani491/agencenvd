import { Droplets } from "lucide-react";
import { LoginForm } from "@/components/admin/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10">
      <Card className="w-full max-w-md border-white/10 bg-white shadow-2xl">
        <CardHeader>
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-lg bg-nvd-blue-primary text-white">
            <Droplets className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl text-nvd-blue-dark">
            Connexion administrateur NVD
          </CardTitle>
          <p className="text-sm leading-6 text-muted-foreground">
            Accès réservé à l'équipe autorisée.
          </p>
        </CardHeader>
        <CardContent>
          <LoginForm initialError={error} />
        </CardContent>
      </Card>
    </main>
  );
}
