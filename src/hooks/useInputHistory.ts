import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useInputHistory(type: string) {
  const { user } = useAuth();
  const [values, setValues] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_inputs_history")
      .select("value")
      .eq("type", type)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setValues(data.map((d) => d.value));
      });
  }, [user, type]);

  const save = useCallback(async (value: string) => {
    if (!user || !value.trim()) return;
    await supabase
      .from("user_inputs_history")
      .upsert({ user_id: user.id, type, value: value.trim() }, { onConflict: "user_id,type,value" });
  }, [user, type]);

  const getSuggestions = useCallback((query: string) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return values.filter((v) => v.toLowerCase().includes(q)).slice(0, 5);
  }, [values]);

  return { values, save, getSuggestions };
}
