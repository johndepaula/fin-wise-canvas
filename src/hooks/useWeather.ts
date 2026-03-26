import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WeatherData {
  temperature: number;
  condition: string;
  city: string;
  loading: boolean;
}

const weatherCodeToCondition = (code: number): string => {
  if (code === 0) return "Limpo ☀️";
  if (code <= 3) return "Parcialmente nublado ⛅";
  if (code <= 48) return "Nublado ☁️";
  if (code <= 57) return "Garoa 🌦️";
  if (code <= 67) return "Chuva 🌧️";
  if (code <= 77) return "Neve ❄️";
  if (code <= 82) return "Pancadas 🌧️";
  if (code <= 86) return "Neve forte ❄️";
  if (code <= 99) return "Trovoadas ⛈️";
  return "—";
};

export function useWeather(): WeatherData {
  const { user } = useAuth();
  const [temperature, setTemperature] = useState(0);
  const [condition, setCondition] = useState("—");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (!user || fetched.current) return;
    fetched.current = true;

    const fetchWeather = async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true`
        );
        const data = await res.json();
        if (data.current_weather) {
          setTemperature(Math.round(data.current_weather.temperature));
          setCondition(weatherCodeToCondition(data.current_weather.weathercode));
        }
      } catch {
        /* silently fail */
      }
      setLoading(false);
    };

    const fetchCity = async (lat: number, lng: number): Promise<string> => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=pt`
        );
        const data = await res.json();
        return data.address?.city || data.address?.town || data.address?.municipality || "";
      } catch {
        return "";
      }
    };

    const saveAndFetch = async (lat: number, lng: number) => {
      const cityName = await fetchCity(lat, lng);
      setCity(cityName);

      supabase
        .from("user_location")
        .upsert({ user_id: user.id, latitude: lat, longitude: lng, city: cityName }, { onConflict: "user_id" })
        .then(() => {});
      fetchWeather(lat, lng);

      const id = setInterval(() => fetchWeather(lat, lng), 10 * 60 * 1000);
      return () => clearInterval(id);
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => saveAndFetch(pos.coords.latitude, pos.coords.longitude),
        async () => {
          const { data } = await supabase.from("user_location").select("*").single();
          if (data) {
            setCity(data.city || "");
            fetchWeather(data.latitude, data.longitude);
          } else {
            setLoading(false);
          }
        }
      );
    } else {
      setLoading(false);
    }
  }, [user]);

  return { temperature, condition, city, loading };
}
