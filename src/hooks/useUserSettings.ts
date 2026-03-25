import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export interface UserSettings {
  chart_color: string;
  background_color: string;
  chart_line_style: string;
  category_chart_color: string;
}

const DEFAULTS: UserSettings = {
  chart_color: "#8B5CF6",
  background_color: "#1A1F2C",
  chart_line_style: "monotone",
  category_chart_color: "#3B82F6",
};

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setSettings(DEFAULTS); setLoading(false); return; }
    supabase.from("user_settings").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) {
        setSettings({
          chart_color: data.chart_color || DEFAULTS.chart_color,
          background_color: data.background_color || DEFAULTS.background_color,
          chart_line_style: data.chart_line_style || DEFAULTS.chart_line_style,
          category_chart_color: (data as any).category_chart_color || DEFAULTS.category_chart_color,
        });
      }
      setLoading(false);
    });
  }, [user]);

  const save = useCallback(async (updates: Partial<UserSettings>) => {
    if (!user) return;
    const newSettings = { ...settings, ...updates };
    const { error } = await supabase.from("user_settings")
      .upsert({ user_id: user.id, ...newSettings } as any, { onConflict: "user_id" });
    if (error) {
      toast({ title: "Erro ao salvar configurações", description: error.message, variant: "destructive" });
    } else {
      setSettings(newSettings);
      toast({ title: "Configurações salvas" });
    }
  }, [user, settings]);

  return { settings, loading, save };
}
