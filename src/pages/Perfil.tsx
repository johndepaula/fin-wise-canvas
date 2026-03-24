import { useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Mail, Camera } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { profile, uploadAvatar, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayName = profile?.display_name || email;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatar(file);
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Meu Perfil</h1>
      <p className="text-muted-foreground text-sm mb-8">Gerencie suas informações pessoais</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="relative group">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-semibold text-xl">{initials}</span>
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
            <div>
              <p className="font-medium text-lg">{displayName}</p>
              <p className="text-muted-foreground text-sm">Conta pessoal</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nome de exibição</Label>
              <Input
                defaultValue={profile?.display_name || ""}
                placeholder="Seu nome"
                className="bg-background border-border mt-1"
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val !== (profile?.display_name || "")) updateProfile({ display_name: val || null });
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{email}</p>
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <Button
            variant="outline"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" /> Sair da conta
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
