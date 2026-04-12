import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2, Mail } from "lucide-react";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [searchParams] = useSearchParams();
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      setIsLogin(false);
    }
  }, [searchParams]);

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
        options: { 
          emailRedirectTo: window.location.origin,
          data: {
            referral_code: referralCode.trim() || null
          }
        },
      });
      if (error) {
        toast({ title: "Erro ao criar conta", description: error.message, variant: "destructive" });
      } else {
        setShowVerification(true);
      }
    }
    setLoading(false);
  };

  if (showVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm animate-fade-in-up">
          <Card className="bg-card border-border">
            <CardContent className="p-8 text-center">
              <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Verifique seu email</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Enviamos um link de confirmação para <strong className="text-foreground">{email}</strong>. Verifique sua caixa de entrada e clique no link para ativar sua conta.
              </p>
              <Button variant="outline" className="w-full" onClick={() => { setShowVerification(false); setIsLogin(true); }}>
                Ir para login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
              
              {!isLogin && (
                <div className="animate-fade-in-up">
                  <Label className="text-xs text-muted-foreground">Código de indicação (opcional)</Label>
                  <Input
                    type="text"
                    placeholder="Ex: USER123"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    className="bg-background border-border mt-1 transition-all"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Se você foi convidado por um amigo, insira o código aqui.
                  </p>
                </div>
              )}

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
