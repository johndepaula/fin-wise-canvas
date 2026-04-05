import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Link2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Indicacoes() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    if (!user?.id) return;
    const fetchCode = async () => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("referral_code")
          .eq("id", user.id)
          .single();
        if (data?.referral_code) {
          setReferralCode(data.referral_code);
        } else {
          const fallback = `USER${user.id.substring(0, 6).toUpperCase()}`;
          setReferralCode(fallback);
        }
      } catch {
        setReferralCode(`USER${user.id.substring(0, 6).toUpperCase()}`);
      }
    };
    fetchCode();
  }, [user]);

  const referralLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const copyCode = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({ title: "Código copiado!", description: "Compartilhe com seus amigos." });
  };

  const copyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    toast({ title: "Link copiado!", description: "Envie para seus amigos se cadastrarem." });
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Indique um amigo</h1>
      <p className="text-muted-foreground text-sm mb-8">Compartilhe seu link e cresça junto com a plataforma.</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>

          <div>
            <h2 className="text-lg font-medium mb-2">Seu código de indicação</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Use o código ou o link para convidar novos usuários.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              value={referralCode || "Carregando..."}
              readOnly
              className="text-center font-mono text-lg font-medium bg-muted/50"
            />
            <Button onClick={copyCode} size="icon" disabled={!referralCode} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Input
              value={referralLink || "Carregando..."}
              readOnly
              className="text-xs bg-muted/50 truncate"
            />
            <Button onClick={copyLink} size="icon" disabled={!referralLink} variant="outline">
              <Link2 className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={copyLink} className="w-full gap-2 mt-4" disabled={!referralLink}>
            <Users className="h-4 w-4" />
            Copiar link de indicação
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
