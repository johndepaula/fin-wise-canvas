import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Conta criada!", description: "Verifique seu email para confirmar o cadastro." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm animate-fade-in-up">
        <Card className="bg-card border-border">
          <CardContent className="p-6">
            <div className="mb-6 flex justify-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="login-logo-animation h-16 w-auto object-contain"
              />
            </div>
            <h2 className="text-lg font-semibold mb-1">{isLogin ? "Entrar" : "Criar conta"}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isLogin ? "Acesse sua conta para continuar" : "Preencha os dados para se cadastrar"}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <Input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background border-border mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Senha</Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-background border-border mt-1"
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLogin ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-4">
              {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-primary hover:underline font-medium"
              >
                {isLogin ? "Cadastre-se" : "Entrar"}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
