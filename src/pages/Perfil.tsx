import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { LogOut, Mail, Camera, Save, Loader2, Image } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";

export default function Perfil() {
  const { user, signOut } = useAuth();
  const { profile, uploadAvatar, updateProfile } = useProfile();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      if (!name && profile.display_name) {
        setName(profile.display_name);
      }
      if (profile.avatar_url && !avatarFile) {
        setPreviewUrl(profile.avatar_url);
      }
      if ((profile as any).logo_url && !logoFile) {
        setLogoPreviewUrl((profile as any).logo_url);
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let currentAvatarUrl = profile?.avatar_url || null;
      let currentLogoUrl = (profile as any)?.logo_url || null;

      if (avatarFile) {
        const uploadedUrl = await uploadAvatar(avatarFile);
        if (uploadedUrl) currentAvatarUrl = uploadedUrl;
      }

      if (logoFile) {
        const uploadedLogoUrl = await uploadAvatar(logoFile);
        if (uploadedLogoUrl) currentLogoUrl = uploadedLogoUrl;
      }

      await updateProfile({ display_name: name, avatar_url: currentAvatarUrl, logo_url: currentLogoUrl } as any);
      setAvatarFile(null);
      setLogoFile(null);
    } catch (error) {
      console.error("Erro ao salvar perfil:", error);
    } finally {
      setIsSaving(false);
    }
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

          {/* Logo */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Logo da plataforma</Label>
            <div className="flex items-center gap-4">
              <div className="relative group">
                {logoPreviewUrl ? (
                  <img src={logoPreviewUrl} alt="Logo" className="h-14 w-14 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <button
                  onClick={() => logoFileRef.current?.click()}
                  className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 text-white" />
                </button>
                <input ref={logoFileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </div>
              <p className="text-sm text-muted-foreground">Clique para alterar a logo</p>
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
          </div>

          <Separator className="bg-border/50" />

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
