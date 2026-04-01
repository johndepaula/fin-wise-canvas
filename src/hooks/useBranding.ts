import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface Branding {
  logo_url: string | null;
  logo_name: string | null;
}

let brandingCache: Branding | null = null;

export function useBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<Branding | null>(brandingCache);
  const [loading, setLoading] = useState(!brandingCache);

  const fetch = useCallback(async () => {
    if (!user) { setBranding(null); setLoading(false); return; }

    // Use cache if available
    if (brandingCache) {
      setBranding(brandingCache);
      setLoading(false);
      return;
    }

    const { data } = await (supabase as any)
      .from("app_branding")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const result: Branding = {
      logo_url: data?.logo_url ?? null,
      logo_name: data?.logo_name ?? null,
    };

    brandingCache = result;
    setBranding(result);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const updateBranding = useCallback(async (updates: Partial<Branding>) => {
    if (!user) return;
    const { error } = await (supabase as any)
      .from("app_branding")
      .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });

    if (error) {
      toast({ title: "Erro ao salvar branding", description: error.message, variant: "destructive" });
      throw error;
    }
    const updated = { ...branding, ...updates } as Branding;
    brandingCache = updated;
    setBranding(updated);
    toast({ title: "Identidade visual salva!" });
  }, [user, branding]);

  const uploadLogo = useCallback(async (file: File): Promise<string | null> => {
    if (!user) return null;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/logo_${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("logos").upload(path, file, { upsert: true });
    if (error) {
      toast({ title: "Erro no upload da logo", description: error.message, variant: "destructive" });
      throw error;
    }
    const { data: urlData } = supabase.storage.from("logos").getPublicUrl(path);
    return `${urlData.publicUrl}?t=${Date.now()}`;
  }, [user]);

  const invalidateCache = useCallback(() => {
    brandingCache = null;
    fetch();
  }, [fetch]);

  return { branding, loading, updateBranding, uploadLogo, invalidateCache };
}
