import { useEffect } from "react";
import { saveResult } from "../lib/db";
import { PARTIDOS_GRUPOS } from "../lib/fixture";

const NAME_MAP = {
  "Mexico": "México", "South Africa": "Sudáfrica",
  "Korea Republic": "Corea del Sur", "South Korea": "Corea del Sur",
  "Czechia": "República Checa", "Czech Republic": "República Checa",
  "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "United States": "Estados Unidos", "Netherlands": "Países Bajos",
  "Japan": "Japón", "Sweden": "Suecia", "Tunisia": "Túnez",
  "Belgium": "Bélgica", "Iran": "Irán", "New Zealand": "Nueva Zelanda",
  "Spain": "España", "Cape Verde": "Cabo Verde", "Saudi Arabia": "Arabia Saudita",
  "France": "Francia", "Norway": "Noruega", "Argentina": "Argentina",
  "Algeria": "Argelia", "Austria": "Austria", "Jordan": "Jordania",
  "Portugal": "Portugal", "DR Congo": "RD del Congo", "Uzbekistan": "Uzbekistán",
  "England": "Inglaterra", "Croatia": "Croacia", "Panama": "Panamá",
  "Scotland": "Escocia", "Haiti": "Haití", "Turkey": "Turquía",
  "Germany": "Alemania", "Curacao": "Curazao", "Ivory Coast": "Costa de Marfil",
  "Ecuador": "Ecuador", "Morocco": "Marruecos", "Switzerland": "Suiza",
  "Qatar": "Catar", "Serbia": "Serbia", "Egypt": "Egipto",
  "Paraguay": "Paraguay", "China PR": "China", "Ghana": "Ghana",
  "El Salvador": "El Salvador", "Slovenia": "Eslovenia", "Peru": "Perú",
  "Ireland": "Irlanda", "Uruguay": "Uruguay", "Honduras": "Honduras",
  "Brazil": "Brasil", "Colombia": "Colombia", "Costa Rica": "Costa Rica",
  "Cameroon": "Camerún", "Italy": "Italia", "Australia": "Australia",
  "Venezuela": "Venezuela", "Iraq": "Iraq",
};

function normalizeName(name) {
  return NAME_MAP[name] || name;
}

function findPartidoId(homeTeam, awayTeam) {
  const local     = normalizeName(homeTeam);
  const visitante = normalizeName(awayTeam);
  return PARTIDOS_GRUPOS.find(
    (p) => p.local === local && p.visitante === visitante
  )?.id ?? null;
}

export function useResultsSync() {
  useEffect(() => {
    async function sync() {
      try {
        console.log("[BakiProde] Sincronizando resultados...");
        const res  = await fetch("/api/resultados");
        if (!res.ok) {
          console.error("[BakiProde] Error en /api/resultados:", res.status);
          return;
        }
        const data = await res.json();
        let count = 0;

        for (const event of data.events ?? []) {
          const competition = event.competitions?.[0];
          if (!competition) continue;

          const state = competition.status?.type?.state;
          if (state !== "post") continue;

          const competitors = competition.competitors ?? [];
          const home = competitors.find((c) => c.homeAway === "home");
          const away = competitors.find((c) => c.homeAway === "away");
          if (!home || !away) continue;

          const homeScore = parseInt(home.score ?? 0);
          const awayScore = parseInt(away.score ?? 0);
          if (isNaN(homeScore) || isNaN(awayScore)) continue;

          const id = findPartidoId(home.team.displayName, away.team.displayName);
          if (!id) {
            console.warn("[BakiProde] Partido no encontrado:", home.team.displayName, "vs", away.team.displayName);
            continue;
          }

          await saveResult(id, homeScore, awayScore);
          count++;
        }

        console.log(`[BakiProde] Sincronización completa — ${count} partidos actualizados`);
      } catch (e) {
        console.error("[BakiProde] Error sincronizando:", e);
      }
    }

    sync();
    const interval = setInterval(sync, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
