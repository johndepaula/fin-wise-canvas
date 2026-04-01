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

    // Use cache if available
    if (profileCache) {
      setProfile(profileCache);
      setLoading(false);
      return;
    }

    // Try new user_profile table first
    const { data: newProfileData } = await (supabase as any)
      .from("user_profile")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (newProfileData) {
      const result: Profile = {
        display_name: newProfileData.name,
        avatar_url: newProfileData.profile_image_url,
      };
      profileCache = result;
      setProfile(result);
      setLoading(false);
      return;
    }

    // Fallback: try legacy profiles table
    const { data: legacyData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (legacyData) {
      const result: Profile = {
        display_name: legacyData.display_name,
        avatar_url: legacyData.avatar_url,
      };
      profileCache = result;
      setProfile(result);
      setLoading(false);
      return;
    }

    // Create automatically if it doesn't exist in either table
    const defaultName = user.email?.split("@")[0] || "Usuário";
    const newEntry = { user_id: user.id, name: defaultName, profile_image_url: null };
    await (supabase as any).from("user_profile").insert(newEntry);

    const result: Profile = { display_name: defaultName, avatar_url: null };
    profileCache = result;
    setProfile(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateProfile = useCallback(async (updates: Partial<Profile>) => {
    if (!user) return;

    const mapped: Record<string, unknown> = { user_id: user.id };
    if ("display_name" in updates) mapped.name = updates.display_name;
    if ("avatar_url" in updates) mapped.profile_image_url = updates.avatar_url;
    mapped.updated_at = new Date().toISOString();

    const { error } = await (supabase as any)
      .from("user_profile")
      .upsert(mapped, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
      throw error;
    }

    // Keep legacy profiles table in sync too
    await supabase
      .from("profiles")
      .upsert({ id: user.id, display_name: updates.display_name, avatar_url: updates.avatar_url });

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
