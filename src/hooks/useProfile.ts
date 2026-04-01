import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Profile {
  display_name: string | null;
  avatar_url: string | null;
}

// In-memory cache to avoid multiple requests per session
let profileCache: Profile | null = null;

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(profileCache);
  const [loading, setLoading] = useState(!profileCache);

  const fetch = useCallback(async () => {
    if (!user) { setProfile(null); setLoading(false); return; }

    if (profileCache) {
      setProfile(profileCache);
      setLoading(false);
      return;
    }

    // Use the existing "profiles" table
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      const result: Profile = {
        display_name: data.display_name,
        avatar_url: data.avatar_url,
      };
      profileCache = result;
      setProfile(result);
    } else {
      // Auto-create if not found
      const defaultName = user.email?.split("@")[0] || "Usuário";
      await supabase
        .from("profiles")
        .insert({ id: user.id, display_name: defaultName, avatar_url: null });

      const result: Profile = { display_name: defaultName, avatar_url: null };
      profileCache = result;
      setProfile(result);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, ...updates });

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
      throw error;
    }

    const updated = { ...profile, ...updates } as Profile;
    profileCache = updated;
    setProfile(updated);
    toast({ title: "Sucesso", description: "Seu perfil foi salvo com sucesso." });
  }, [user, profile]);

  const uploadAvatar = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatar").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      throw error;
    }
    const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(path);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  }, [user]);

  const invalidateCache = useCallback(() => {
    profileCache = null;
    fetch();
  }, [fetch]);

  return { profile, loading, updateProfile, uploadAvatar, invalidateCache };
}
