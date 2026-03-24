import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useCustomCategories() {
  const { user } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);

  const fetch = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("custom_categories")
      .select("name")
      .order("name");
    if (data) setCategories(data.map((c) => c.name));
  }, [user]);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (name: string) => {
    if (!user || !name.trim()) return;
    const trimmed = name.trim();
    if (categories.includes(trimmed)) return;
    await supabase.from("custom_categories").insert({ user_id: user.id, name: trimmed });
    setCategories((prev) => [...prev, trimmed].sort());
  }, [user, categories]);

  return { categories, add, refresh: fetch };
}
