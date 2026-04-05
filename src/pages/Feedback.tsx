import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function Feedback() {
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setLoading(true);

    const { error } = await supabase
      .from("feedbacks")
      .insert({ user_id: user.id, message: message.trim() });

    if (error) {
      toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Feedback enviado!", description: "Obrigado pela sua sugestão." });
      setMessage("");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Feedback</h1>
      <p className="text-muted-foreground text-sm mb-8">Envie sugestões para melhorar a plataforma.</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <MessageSquare className="h-7 w-7 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="Escreva sua sugestão ou feedback aqui..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] bg-background border-border resize-none"
              required
            />
            <Button type="submit" className="w-full gap-2" disabled={loading || !message.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Enviar feedback
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
