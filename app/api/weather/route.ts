import { NextRequest, NextResponse } from "next/server";

interface OWMCurrentResponse {
  name: string;
  main: { temp: number; temp_min: number; temp_max: number; humidity: number };
  weather: Array<{ description: string }>;
}

interface OWMForecastItem {
  dt: number;
  main: { temp_max: number; temp_min: number };
  weather: Array<{ description: string }>;
}

interface OWMForecastResponse {
  list: OWMForecastItem[];
}

export interface WeatherDay {
  date: string;
  high: number;
  low: number;
  conditions: string;
}

export interface WeatherData {
  city: string;
  temperature: number;
  conditions: string;
  humidity: number;
  todayHigh: number;
  todayLow: number;
  forecast: WeatherDay[];
}

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city");
  if (!city?.trim()) {
    return NextResponse.json({ error: "Missing city parameter" }, { status: 400 });
  }

  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    console.error("[/api/weather] OPENWEATHER_API_KEY is not set");
    return NextResponse.json({ error: "OPENWEATHER_API_KEY is not configured" }, { status: 500 });
  }

  try {
    const base = "https://api.openweathermap.org/data/2.5";
    const q = encodeURIComponent(city.trim());

    const [currentRes, forecastRes] = await Promise.all([
      fetch(`${base}/weather?q=${q}&appid=${key}&units=imperial`),
      fetch(`${base}/forecast?q=${q}&appid=${key}&units=imperial`),
    ]);

    if (!currentRes.ok) {
      const err = await currentRes.json().catch(() => ({})) as { message?: string };
      const message = err.message ?? "City not found";
      console.error(`[/api/weather] OWM error (${currentRes.status}):`, message);
      return NextResponse.json({ error: message }, { status: currentRes.status === 404 ? 404 : 502 });
    }

    const current = await currentRes.json() as OWMCurrentResponse;
    const forecast = await forecastRes.json() as OWMForecastResponse;

    // Group forecast 3-hour slots by calendar day; skip today
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

    const forecastDays: WeatherDay[] = Array.from(dayMap.entries())
      .slice(0, 3)
      .map(([date, d]) => ({
        date,
        high: Math.round(Math.max(...d.highs)),
        low: Math.round(Math.min(...d.lows)),
        // Use the midday reading for conditions
        conditions: d.conditions[Math.floor(d.conditions.length / 2)],
      }));

    const result: WeatherData = {
      city: current.name,
      temperature: Math.round(current.main.temp),
      conditions: current.weather[0].description,
      humidity: current.main.humidity,
      todayHigh: Math.round(current.main.temp_max),
      todayLow: Math.round(current.main.temp_min),
      forecast: forecastDays,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/weather] Error:", err);
    return NextResponse.json({ error: "Failed to fetch weather", detail: message }, { status: 500 });
  }
}
