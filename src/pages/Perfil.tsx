import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Mail, Camera, Save, Loader2, ImagePlus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useBranding } from "@/hooks/useBranding";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { profile, uploadAvatar, updateProfile, invalidateCache: invalidateProfile } = useProfile();
  const { branding, uploadLogo, updateBranding, invalidateCache: invalidateBranding } = useBranding();
  const navigate = useNavigate();
  const avatarRef = useRef<HTMLInputElement>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [logoName, setLogoName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [previewLogo, setPreviewLogo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (!name && profile.display_name) setName(profile.display_name);
      if (profile.avatar_url && !avatarFile) setPreviewAvatar(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    if (branding) {
      if (!logoName && branding.logo_name) setLogoName(branding.logo_name);
      if (branding.logo_url && !logoFile) setPreviewLogo(branding.logo_url);
    }
  }, [branding]);

  const email = user?.email ?? "";
  const initials = email.slice(0, 2).toUpperCase();
  const displayNameDisplay = name || profile?.display_name || email;

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setPreviewLogo(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save profile (name + avatar)
      let currentAvatarUrl = profile?.avatar_url || null;
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) currentAvatarUrl = uploadedUrl;
      }
      await updateProfile({ display_name: name, avatar_url: currentAvatarUrl });
      setAvatarFile(null);

      // Save branding (logo name + logo image)
      let currentLogoUrl = branding?.logo_url || null;
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) currentLogoUrl = uploadedUrl;
      }
      await updateBranding({ logo_name: logoName, logo_url: currentLogoUrl });
      setLogoFile(null);

      // Invalidate caches so Dashboard updates immediately
      invalidateProfile();
      invalidateBranding();
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-lg animate-fade-in-up">
      <h1 className="text-2xl font-semibold tracking-tight mb-1">Meu Perfil</h1>
      <p className="text-muted-foreground text-sm mb-8">Gerencie suas informações e identidade visual</p>

      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">

          {/* ── Avatar ── */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              {previewAvatar ? (
                <img src={previewAvatar} alt="Avatar" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/15 flex items-center justify-center">
                  <span className="text-primary font-semibold text-xl">{initials}</span>
                </div>
              )}
              <button
                onClick={() => avatarRef.current?.click()}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
            <div>
              <p className="font-medium text-lg">{displayNameDisplay}</p>
              <p className="text-muted-foreground text-sm">Conta pessoal</p>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* ── Dados pessoais ── */}
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
          </div>

          <Separator className="bg-border/50" />

          {/* ── Identidade Visual (Logo) ── */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-foreground">Identidade Visual</p>

            <div className="flex items-center gap-4">
              <div className="relative group">
                {previewLogo ? (
                  <img src={previewLogo} alt="Logo" className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xl">F</span>
                  </div>
                )}
                <button
                  onClick={() => logoRef.current?.click()}
                  className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <ImagePlus className="h-5 w-5 text-white" />
                </button>
                <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">Nome da marca</Label>
                <Input
                  value={logoName}
                  onChange={(e) => setLogoName(e.target.value)}
                  placeholder="Ex: Finplex"
                  className="bg-background border-border mt-1"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Passe o mouse na logo para trocar a imagem</p>
          </div>

          <Separator className="bg-border/50" />

          {/* ── Ações ── */}
          <div className="space-y-3">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? "Salvando..." : "Salvar Alterações"}
            </Button>

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
