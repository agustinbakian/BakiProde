import {
  doc, getDoc, setDoc, updateDoc,
  collection, onSnapshot, serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { POINTS } from "./config";

// ── Pronósticos ──────────────────────────────────────────────────────────────

/** Guarda o actualiza el pronóstico de un partido para un usuario */
export async function savePrediction(uid, partidoId, local, visitante) {
  const ref = doc(db, "predictions", uid);
  await setDoc(
    ref,
    { [partidoId]: { local, visitante, updatedAt: serverTimestamp() } },
    { merge: true }
  );
}

/** Suscripción en tiempo real a los pronósticos de un usuario */
export function subscribeToPredictions(uid, callback) {
  const ref = doc(db, "predictions", uid);
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : {}));
}

// ── Resultados oficiales ─────────────────────────────────────────────────────

/** Guarda resultado real de un partido (llamado desde el cron de resultados) */
export async function saveResult(partidoId, local, visitante) {
  const ref = doc(db, "results", "oficial");
  await setDoc(
    ref,
    { [partidoId]: { local, visitante, updatedAt: serverTimestamp() } },
    { merge: true }
  );
}

/** Suscripción en tiempo real a resultados oficiales */
export function subscribeToResults(callback) {
  const ref = doc(db, "results", "oficial");
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : {}));
}

// ── Ranking ──────────────────────────────────────────────────────────────────

/** Calcula puntos de un usuario dado sus predicciones y los resultados */
export function calcPoints(pred, result) {
  if (
    !pred || !result ||
    pred.local == null || pred.visitante == null ||
    result.local == null || result.visitante == null
  ) return null;

  const { local: pl, visitante: pv } = pred;
  const { local: rl, visitante: rv } = result;

  if (pl === rl && pv === rv) return POINTS.EXACT;

  const predWinner  = pl > pv ? "L" : pv > pl ? "V" : "E";
  const realWinner  = rl > rv ? "L" : rv > rl ? "V" : "E";
  return predWinner === realWinner ? POINTS.WINNER : POINTS.WRONG;
}

export function calcUserStats(predictions, results) {
  let pts = 0, exact = 0, winner = 0, wrong = 0, pending = 0;

  Object.entries(results).forEach(([partidoId, result]) => {
    const pred = predictions[partidoId];
    if (!pred) return;
    const pt = calcPoints(pred, result);
    if (pt === null) { pending++; return; }
    pts += pt;
    if (pt === POINTS.EXACT)  exact++;
    else if (pt === POINTS.WINNER) winner++;
    else wrong++;
  });

  return { pts, exact, winner, wrong, pending, predCount: Object.keys(predictions).length };
}

// ── Perfil de usuario ────────────────────────────────────────────────────────

export async function upsertUser(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid:         user.uid,
      displayName: user.displayName,
      email:       user.email,
      photoURL:    user.photoURL,
      joinedAt:    serverTimestamp(),
    });
  }
}

/** Suscripción en tiempo real a todos los usuarios (para el ranking) */
export function subscribeToUsers(callback) {
  return onSnapshot(collection(db, "users"), (snap) => {
    const users = {};
    snap.forEach((d) => { users[d.id] = d.data(); });
    callback(users);
  });
}

/** Suscripción en tiempo real a todos los pronósticos (para el ranking global) */
export function subscribeToAllPredictions(callback) {
  return onSnapshot(collection(db, "predictions"), (snap) => {
    const all = {};
    snap.forEach((d) => { all[d.id] = d.data(); });
    callback(all);
  });
}
