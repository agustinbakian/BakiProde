import { useEffect } from "react";
import { FOOTBALL_DATA_API_KEY, WC_COMPETITION_ID } from "../lib/config";
import { saveResult } from "../lib/db";
import { PARTIDOS_GRUPOS } from "../lib/fixture";

// Mapa de nombre normalizado → nombre en nuestro fixture
// Ajustar si football-data.org usa nombres distintos
const NAME_MAP = {
  "Morocco":          "Marruecos",
  "Ukraine":          "Ucrania",
  "South Africa":     "Sudáfrica",
  "Japan":            "Japón",
  "Canada":           "Canadá",
  "France":           "Francia",
  "South Korea":      "Corea del Sur",
  "England":          "Inglaterra",
  "Slovakia":         "Eslovaquia",
  "Netherlands":      "Países Bajos",
  "Saudi Arabia":     "Arabia Saudita",
  "Switzerland":      "Suiza",
  "United States":    "Estados Unidos",
  "Belgium":          "Bélgica",
  "Italy":            "Italia",
  "Croatia":          "Croacia",
  "Australia":        "Australia",
  "Turkey":           "Turquía",
  "New Zealand":      "Nueva Zelanda",
  "El Salvador":      "El Salvador",
  "Slovenia":         "Eslovenia",
  "Algeria":          "Argelia",
  "Uzbekistan":       "Uzbekistán",
  "Ireland":          "Irlanda",
  "Germany":          "Alemania",
  "Spain":            "España",
  "Portugal":         "Portugal",
  "Colombia":         "Colombia",
  "Venezuela":        "Venezuela",
  "Serbia":           "Serbia",
  "Egypt":            "Egipto",
  "Paraguay":         "Paraguay",
  "China":            "China",
  "Poland":           "Polonia",
  "Mexico":           "México",
  "Brazil":           "Brasil",
  "Argentina":        "Argentina",
  "Uruguay":          "Uruguay",
  "Ecuador":          "Ecuador",
  "Chile":            "Chile",
  "Peru":             "Perú",
  "Ghana":            "Ghana",
  "Iran":             "Irán",
  "Honduras":         "Honduras",
  "Senegal":          "Senegal",
  "Cameroon":         "Camerún",
  "Costa Rica":       "Costa Rica",
  "Austria":          "Austria",
};

function normalizeName(name) {
  return NAME_MAP[name] || name;
}

// Busca el partido en nuestro fixture por los nombres de los equipos
function findPartidoId(homeTeam, awayTeam) {
  const local     = normalizeName(homeTeam);
  const visitante = normalizeName(awayTeam);
  const p = PARTIDOS_GRUPOS.find(
    (p) => p.local === local && p.visitante === visitante
  );
  return p?.id ?? null;
}

/**
 * Hook que sincroniza resultados finalizados desde football-data.org
 * Solo corre si hay API key configurada.
 * Se ejecuta una vez al montar y luego cada 5 minutos.
 */
export function useResultsSync() {
  useEffect(() => {
    if (!FOOTBALL_DATA_API_KEY || FOOTBALL_DATA_API_KEY === "TU_FOOTBALL_DATA_API_KEY") return;

    async function sync() {
      try {
        const res = await fetch(
          `https://api.football-data.org/v4/competitions/${WC_COMPETITION_ID}/matches?stage=GROUP_STAGE&status=FINISHED`,
          { headers: { "X-Auth-Token": FOOTBALL_DATA_API_KEY } }
        );
        if (!res.ok) return;
        const data = await res.json();

        for (const match of data.matches ?? []) {
          const id = findPartidoId(match.homeTeam.name, match.awayTeam.name);
          if (!id) continue;
          const { home, away } = match.score.fullTime;
          if (home == null || away == null) continue;
          await saveResult(id, home, away);
        }
      } catch (e) {
        console.error("[BakiProde] Error sincronizando resultados:", e);
      }
    }

    sync();
    const interval = setInterval(sync, 5 * 60 * 1000); // cada 5 min
    return () => clearInterval(interval);
  }, []);
}
