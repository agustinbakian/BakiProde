// ─────────────────────────────────────────────
//  BakiProde — Fixture Mundial 2026
//  Fechas y horarios aproximados (actualizar cuando FIFA los confirme)
// ─────────────────────────────────────────────

export const FLAG_ISO = {
  Argentina:       "ar", Ecuador:        "ec", Marruecos:      "ma", Ucrania:       "ua",
  Brasil:          "br", México:         "mx", Polonia:        "pl", "Sudáfrica":   "za",
  España:          "es", Alemania:       "de", Japón:          "jp", Canadá:        "ca",
  Francia:         "fr", Portugal:       "pt", "Corea del Sur":"kr", Honduras:      "hn",
  Inglaterra:      "gb-eng", Uruguay:    "uy", Senegal:        "sn", Eslovaquia:    "sk",
  "Países Bajos":  "nl", Colombia:       "co", "Arabia Saudita":"sa", Suiza:        "ch",
  "Estados Unidos":"us", Bélgica:        "be", "Costa Rica":   "cr", Camerún:       "cm",
  Italia:          "it", Croacia:        "hr", Chile:          "cl", Australia:     "au",
  Turquía:         "tr", Austria:        "at", Venezuela:      "ve", "Nueva Zelanda":"nz",
  Serbia:          "rs", Egipto:         "eg", Paraguay:       "py", China:         "cn",
  Ghana:           "gh", Irán:           "ir", "El Salvador":  "sv", Eslovenia:     "si",
  Perú:            "pe", Irlanda:        "ie", Argelia:        "dz", Uzbekistán:    "uz",
};

export const GRUPOS = {
  A: ["México",         "Sudáfrica",          "Corea del Sur",    "República Checa"],
  B: ["Canadá",         "Bosnia y Herzegovina","Catar",            "Suiza"],
  C: ["Brasil",         "Marruecos",           "Haití",            "Escocia"],
  D: ["Estados Unidos", "Paraguay",            "Australia",        "Turquía"],
  E: ["Alemania",       "Curazao",             "Costa de Marfil",  "Ecuador"],
  F: ["Países Bajos",   "Japón",               "Suecia",           "Túnez"],
  G: ["Bélgica",        "Egipto",              "Irán",             "Nueva Zelanda"],
  H: ["España",         "Cabo Verde",          "Arabia Saudita",   "Uruguay"],
  I: ["Francia",        "Noruega",             "Senegal",          "Iraq"],
  J: ["Argentina",      "Argelia",             "Austria",          "Jordania"],
  K: ["Portugal",       "Colombia",            "RD del Congo",     "Uzbekistán"],
  L: ["Inglaterra",     "Croacia",             "Ghana",            "Panamá"],
};

const HORARIOS = ["15:00", "18:00", "21:00", "00:00"];

function buildFixture() {
  const partidos = [];
  let id = 1;
  const base = new Date("2026-06-11T00:00:00");

  Object.entries(GRUPOS).forEach(([grupo, teams], gi) => {
    const pairs = [];
    for (let i = 0; i < teams.length - 1; i++)
      for (let j = i + 1; j < teams.length; j++)
        pairs.push([teams[i], teams[j]]);

    pairs.forEach((pair, pi) => {
      const d = new Date(base);
      d.setDate(d.getDate() + Math.floor(gi / 2) + pi * 2);
      const hora = HORARIOS[(gi + pi) % HORARIOS.length];
      const [hh] = hora.split(":").map(Number);
      const fechaSort = d.getTime() + hh * 3600 * 1000;

      partidos.push({
        id,
        grupo,
        local:     pair[0],
        visitante: pair[1],
        fecha:     d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }),
        fechaISO:  d.toISOString().split("T")[0],
        hora,
        fechaSort,
        fase:      "grupos",
      });
      id++;
    });
  });

  partidos.sort((a, b) => a.fechaSort - b.fechaSort);
  return partidos;
}

export const PARTIDOS_GRUPOS = buildFixture();

// Bracket eliminatorio — los equipos se completan automáticamente
// cuando termina la fase de grupos
export const BRACKET_ELIM = [
  {
    fase: "Octavos de final",
    ronda: "R16",
    partidos: [
      { id: "R16_1", label: "1A vs 2B" }, { id: "R16_2", label: "1C vs 2D" },
      { id: "R16_3", label: "1E vs 2F" }, { id: "R16_4", label: "1G vs 2H" },
      { id: "R16_5", label: "1B vs 2A" }, { id: "R16_6", label: "1D vs 2C" },
      { id: "R16_7", label: "1F vs 2E" }, { id: "R16_8", label: "1H vs 2G" },
    ],
  },
  {
    fase: "Cuartos de final",
    ronda: "QF",
    partidos: [
      { id: "QF_1", label: "G1 Octavos" }, { id: "QF_2", label: "G2 Octavos" },
      { id: "QF_3", label: "G3 Octavos" }, { id: "QF_4", label: "G4 Octavos" },
    ],
  },
  {
    fase: "Semifinales",
    ronda: "SF",
    partidos: [
      { id: "SF_1", label: "G1 Cuartos" }, { id: "SF_2", label: "G2 Cuartos" },
    ],
  },
  {
    fase: "Final",
    ronda: "F",
    partidos: [{ id: "FINAL", label: "Final" }],
  },
];
