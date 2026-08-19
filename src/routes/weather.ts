import type { Router } from "../router";
import { json } from "../lib/json";
import { getMeta } from "../db/meta";

interface GeocodingResult {
  results?: { name: string; latitude: number; longitude: number }[];
}
interface ForecastResult {
  current?: { temperature_2m: number; relative_humidity_2m: number; wind_speed_10m: number };
}

/** Kulübün konumuna göre anlık hava durumunu ücretsiz/anahtarsız Open-Meteo API'siyle çeker.
 * Konum, var olan genel meta key/value passthrough'unda ("kulup_sehir") saklanır — yeni tablo yok. */
export function registerWeatherRoutes(router: Router): void {
  router.get("/api/weather", async (_request, env) => {
    const sehir = await getMeta(env, "kulup_sehir");
    if (!sehir) return json({ error: "sehir-ayarli-degil" }, { status: 400 });

    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(sehir)}&count=1&language=tr`);
    if (!geoRes.ok) return json({ error: "konum-bulunamadi" }, { status: 502 });
    const geo = (await geoRes.json()) as GeocodingResult;
    const yer = geo.results?.[0];
    if (!yer) return json({ error: "konum-bulunamadi" }, { status: 404 });

    const forecastRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${yer.latitude}&longitude=${yer.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m`
    );
    if (!forecastRes.ok) return json({ error: "hava-durumu-alinamadi" }, { status: 502 });
    const forecast = (await forecastRes.json()) as ForecastResult;
    if (!forecast.current) return json({ error: "hava-durumu-alinamadi" }, { status: 502 });

    return json({
      sehir: yer.name,
      ruzgarKmh: forecast.current.wind_speed_10m,
      sicaklik: forecast.current.temperature_2m,
      nem: forecast.current.relative_humidity_2m,
    });
  });
}
