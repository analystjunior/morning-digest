import type { WeatherData } from "@/app/api/weather/route";

export async function fetchWeatherData(city: string = "New York"): Promise<WeatherData> {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) throw new Error("OPENWEATHER_API_KEY is not configured");

  const base = "https://api.openweathermap.org/data/2.5";
  const q = encodeURIComponent(city.trim());

  const [currentRes, forecastRes] = await Promise.all([
    fetch(`${base}/weather?q=${q}&appid=${key}&units=imperial`),
    fetch(`${base}/forecast?q=${q}&appid=${key}&units=imperial`),
  ]);

  if (!currentRes.ok) {
    const err = await currentRes.json().catch(() => ({})) as { message?: string };
    throw new Error(err.message ?? `OpenWeatherMap error: HTTP ${currentRes.status}`);
  }

  const current = await currentRes.json() as {
    name: string;
    main: { temp: number; temp_min: number; temp_max: number; humidity: number };
    weather: Array<{ description: string }>;
  };
  const forecast = await forecastRes.json() as {
    list: Array<{
      dt: number;
      main: { temp_max: number; temp_min: number };
      weather: Array<{ description: string }>;
    }>;
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

  const dayMap = new Map<string, { highs: number[]; lows: number[]; conditions: string[] }>();
  for (const item of forecast.list) {
    const label = new Date(item.dt * 1000).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric",
    });
    if (label === todayLabel) continue;
    if (!dayMap.has(label)) dayMap.set(label, { highs: [], lows: [], conditions: [] });
    const d = dayMap.get(label)!;
    d.highs.push(item.main.temp_max);
    d.lows.push(item.main.temp_min);
    d.conditions.push(item.weather[0].description);
  }

  const forecastDays = Array.from(dayMap.entries())
    .slice(0, 3)
    .map(([date, d]) => ({
      date,
      high: Math.round(Math.max(...d.highs)),
      low: Math.round(Math.min(...d.lows)),
      conditions: d.conditions[Math.floor(d.conditions.length / 2)],
    }));

  return {
    city: current.name,
    temperature: Math.round(current.main.temp),
    conditions: current.weather[0].description,
    humidity: current.main.humidity,
    todayHigh: Math.round(current.main.temp_max),
    todayLow: Math.round(current.main.temp_min),
    forecast: forecastDays,
  };
}
