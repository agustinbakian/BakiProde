// ─────────────────────────────────────────────
//  BakiProde — Configuración
//  Reemplazá los valores con los de tu proyecto Firebase
//  y tu API key de football-data.org
// ─────────────────────────────────────────────

export const FIREBASE_CONFIG = {
  apiKey:            "TU_FIREBASE_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID",
};

export const FOOTBALL_DATA_API_KEY = "TU_FOOTBALL_DATA_API_KEY";

// ID de la competencia Mundial 2026 en football-data.org
// Actualizar cuando esté disponible (actualmente WC = 2000)
export const WC_COMPETITION_ID = 2000;

// Sistema de puntos
export const POINTS = {
  EXACT:  3,  // resultado exacto
  WINNER: 1,  // ganador correcto (o empate correcto)
  WRONG:  0,
};
