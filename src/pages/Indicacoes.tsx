import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Gift, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";

export default function Indicacoes() {
  const { profile } = useProfile();
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    // If we have it in profile, use it
    if (profile && 'referral_code' in profile && (profile as any).referral_code) {
      setReferralCode((profile as any).referral_code);
    } else if (user?.id) {
      // Fallback: fetch directly if not in the cached profile type yet
      const fetchCode = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (data && (data as any).referral_code) {
          setReferralCode((data as any).referral_code);
        }
      };
      fetchCode();
    }
  }, [profile, user]);

  const copyToClipboard = () => {
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({
      title: "Código copiado!",
      description: "Compartilhe com seus amigos.",
    });
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Indique um amigo</h1>
      <p className="text-muted-foreground text-sm mb-8">Compartilhe seu código e cresça junto com a plataforma.</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Gift className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h2 className="text-lg font-medium mb-2">Seu código de indicação</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Use este código para convidar novos usuários.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Input 
              value={referralCode || "Carregando..."} 
              readOnly 
              className="text-center font-mono text-lg font-medium bg-muted/50" 
            />
            <Button onClick={copyToClipboard} size="icon" disabled={!referralCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={copyToClipboard} className="w-full gap-2 mt-4" disabled={!referralCode}>
            <Users className="h-4 w-4" />
            Copiar Código
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
