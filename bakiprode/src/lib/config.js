// ─────────────────────────────────────────────
//  BakiProde — Configuración
//  Reemplazá los valores con los de tu proyecto Firebase
//  y tu API key de football-data.org
// ─────────────────────────────────────────────

export const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyDQq0r5ROlYvaaTwynVzbp_6sFA98qa6E4",
  authDomain:        "bakiprode.firebaseapp.com",
  projectId:         "bakiprode",
  storageBucket:     "bakiprode.appspot.com",
  messagingSenderId: "123456789",
  appId:             "1:123456789:web:abc123",
};

export const FOOTBALL_DATA_API_KEY = "15f6f92d4bbb432c9702e5bfe4e8254d";

// ID de la competencia Mundial 2026 en football-data.org
// Actualizar cuando esté disponible (actualmente WC = 2000)
export const WC_COMPETITION_ID = 2000;

// Sistema de puntos
export const POINTS = {
  EXACT:  3,  // resultado exacto
  WINNER: 1,  // ganador correcto (o empate correcto)
  WRONG:  0,
};
