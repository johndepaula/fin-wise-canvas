import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { LogOut, Mail, User } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Perfil() {
  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Meu Perfil</h1>
      <p className="text-muted-foreground text-sm mb-8">Gerencie suas informações pessoais</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-primary font-semibold text-xl">MS</span>
            </div>
            <div>
              <p className="font-medium text-lg">Marcos Silva</p>
              <p className="text-muted-foreground text-sm">Conta pessoal</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Nome</p>
                <p className="text-sm">Marcos Silva</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">marcos.silva@email.com</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => toast({ title: "Logout", description: "Funcionalidade disponível em breve." })}
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
