import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Mail, Camera, Save, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { PasswordInput } from "@/components/ui/password-input";
import { supabase } from "@/integrations/supabase/client";

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { profile, uploadAvatar, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    if (profile) {
      if (!name && profile.display_name) {
        setName(profile.display_name);
      }
      if (profile.avatar_url && !avatarFile) {
        setPreviewUrl(profile.avatar_url);
      }
    }
  }, [profile]);

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayNameDisplay = name || profile?.display_name || email;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let currentAvatarUrl = profile?.avatar_url || null;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) currentAvatarUrl = uploadedUrl;
      }

      await updateProfile({ display_name: name, avatar_url: currentAvatarUrl });
      setAvatarFile(null);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "As senhas não coincidem", variant: "destructive" });
      return;
    }
    
    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    
    if (error) {
      toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso!" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setIsUpdatingPassword(false);
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Meu Perfil</h1>
      <p className="text-muted-foreground text-sm mb-8">Gerencie suas informações pessoais</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {previewUrl ? (
                <img src={previewUrl} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
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
              <p className="font-medium text-lg">{displayNameDisplay}</p>
              <p className="text-muted-foreground text-sm">Conta pessoal</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <div>
              <Label className="text-xs text-muted-foreground">Nome de exibição</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="bg-background border-border mt-1"
              />
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm">{email}</p>
              </div>
            </div>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2 mt-4"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Salvando..." : "Salvar Alterações de Perfil"}
            </Button>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Alterar Senha</h3>
            <div>
              <Label className="text-xs text-muted-foreground">Nova Senha</Label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border mt-1"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Confirmar Nova Senha</Label>
              <PasswordInput
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-background border-border mt-1"
              />
            </div>
            <Button
              onClick={handleUpdatePassword}
              disabled={isUpdatingPassword || !newPassword || !confirmPassword}
              className="w-full gap-2"
              variant="secondary"
            >
              {isUpdatingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isUpdatingPassword ? "Atualizando..." : "Atualizar Senha"}
            </Button>
          </div>

          <Separator className="bg-border/50" />

          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" /> Sair da conta
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
