import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { BrandHeader } from "@/components/BrandHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso administrativo — MAGIC BAR Eventos" },
      {
        name: "description",
        content: "Entre na área administrativa da MAGIC BAR para gerenciar preços, drinks e orçamentos.",
      },
      { property: "og:title", content: "Acesso administrativo — MAGIC BAR Eventos" },
      {
        property: "og:description",
        content: "Painel de gestão de preços, cardápio e orçamentos da MAGIC BAR Eventos.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) void navigate({ to: "/admin", replace: true });
    });
    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (sessionData.session) void navigate({ to: "/admin", replace: true });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function signInWithGoogle() {
    setLoading(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if ("error" in result && result.error) throw result.error;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar com o Google.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast.success("Conta criada! Confirme o e-mail para entrar.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível autenticar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <BrandHeader subtitle="Área administrativa" />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16">
        <h1 className="font-display text-3xl font-bold">
          {mode === "signin" ? "Entrar" : "Criar acesso"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Acesso exclusivo da equipe MAGIC BAR para gerenciar preços, cardápio e orçamentos.
        </p>
        <form onSubmit={submit} className="surface-card mt-8 space-y-4 p-6">
          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              maxLength={72}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 w-full rounded-xl" disabled={loading}>
            {loading ? "Aguarde…" : mode === "signin" ? "Entrar" : "Criar conta"}
          </Button>
          <div className="flex items-center gap-3 text-[0.62rem] tracking-[0.24em] text-muted-foreground uppercase">
            <span className="h-px flex-1 bg-border" />
            ou
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl"
            disabled={loading}
            onClick={signInWithGoogle}
          >
            Continuar com Google
          </Button>
          <button
            type="button"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          >
            {mode === "signin" ? "Não tem acesso? Criar conta" : "Já tenho conta — entrar"}
          </button>
        </form>
      </main>
    </div>
  );
}