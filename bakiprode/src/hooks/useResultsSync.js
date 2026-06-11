import { useEffect } from "react";
import { saveResult } from "../lib/db";
import { PARTIDOS_GRUPOS } from "../lib/fixture";

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
  "Norway":           "Noruega",
  "Sweden":           "Suecia",
  "Tunisia":          "Túnez",
  "Curacao":          "Curazao",
  "Ivory Coast":      "Costa de Marfil",
  "Cape Verde":       "Cabo Verde",
  "Iraq":             "Iraq",
  "Jordan":           "Jordania",
  "DR Congo":         "RD del Congo",
  "Panama":           "Panamá",
  "Scotland":         "Escocia",
  "Haiti":            "Haití",
  "Australia":        "Australia",
  "Qatar":            "Catar",
  "Bosnia and Herzegovina": "Bosnia y Herzegovina",
  "Czech Republic":   "República Checa",
  "Czechia":          "República Checa",
};

function normalizeName(name) {
  return NAME_MAP[name] || name;
}

function findPartidoId(homeTeam, awayTeam) {
  const local     = normalizeName(homeTeam);
  const visitante = normalizeName(awayTeam);
  const p = PARTIDOS_GRUPOS.find(
    (p) => p.local === local && p.visitante === visitante
  );
  return p?.id ?? null;
}

export function useResultsSync() {
  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch("/api/resultados");
        if (!res.ok) return;
        const data = await res.json();

        for (const match of data.matches ?? []) {
          // Bloquear partidos en curso o finalizados
          if (!["IN_PLAY", "PAUSED", "FINISHED"].includes(match.status)) continue;
          
          const id = findPartidoId(match.homeTeam.name, match.awayTeam.name);
          if (!id) continue;

          const { home, away } = match.score.fullTime;
          
          // Para partidos en curso usar el score parcial
          const scoreHome = home ?? match.score.halfTime?.home ?? 0;
          const scoreAway = away ?? match.score.halfTime?.away ?? 0;
          
          if (scoreHome === null || scoreAway === null) continue;
          await saveResult(id, scoreHome, scoreAway);
        }
      } catch (e) {
        console.error("[BakiProde] Error sincronizando resultados:", e);
      }
    }

    sync();
    const interval = setInterval(sync, 3 * 60 * 1000); // cada 3 minutos
    return () => clearInterval(interval);
  }, []);
}
