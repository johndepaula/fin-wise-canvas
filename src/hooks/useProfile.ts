import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

interface Profile {
  display_name: string | null;
  avatar_url: string | null;
  logo_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    
    if (data) {
      setProfile({ display_name: data.display_name, avatar_url: data.avatar_url, logo_url: (data as any).logo_url ?? null });
    } else {
      const newProfile = { id: user.id, display_name: user.email?.split("@")[0] || "Usuário", avatar_url: null };
      const { data: insertedData } = await supabase.from("profiles").insert(newProfile).select().single();
      if (insertedData) {
        setProfile({ display_name: insertedData.display_name, avatar_url: insertedData.avatar_url, logo_url: (insertedData as any).logo_url ?? null });
      } else {
        setProfile({ display_name: newProfile.display_name, avatar_url: null, logo_url: null });
      }
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;
    const { error } = await supabase.from("profiles").upsert({ id: user.id, ...updates } as any);
    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
      throw error;
    } else {
      setProfile((prev) => prev ? { ...prev, ...updates } : { display_name: null, avatar_url: null, logo_url: null, ...updates });
      toast({ title: "Sucesso", description: "Seu perfil foi salvo com sucesso." });
    }
  }, [user]);

  const uploadAvatar = useCallback(async (file: File) => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      throw error;
    }
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  }, [user]);

  return { profile, loading, updateProfile, uploadAvatar };
}
