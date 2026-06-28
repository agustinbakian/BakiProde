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

/** Guarda el pronóstico de ganador en penales para un partido eliminatorio */
export async function savePenaltyPred(uid, partidoId, equipo) {
  const ref = doc(db, "predictions", uid);
  await setDoc(
    ref,
    { [`${partidoId}_penal`]: equipo },
    { merge: true }
  );
}

/** Suscripción en tiempo real a los pronósticos de un usuario */
export function subscribeToPredictions(uid, callback) {
  const ref = doc(db, "predictions", uid);
  return onSnapshot(ref, (snap) => callback(snap.exists() ? snap.data() : {}));
}

// ── Resultados oficiales ─────────────────────────────────────────────────────

/** Guarda resultado real de un partido */
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

/** Calcula puntos de un partido de grupos */
export function calcPoints(pred, result) {
  if (
    !pred || !result ||
    pred.local == null || pred.visitante == null ||
    result.local == null || result.visitante == null
  ) return null;

  const { local: pl, visitante: pv } = pred;
  const { local: rl, visitante: rv } = result;

  if (pl === rl && pv === rv) return POINTS.EXACT;

  const predWinner = pl > pv ? "L" : pv > pl ? "V" : "E";
  const realWinner = rl > rv ? "L" : rv > rl ? "V" : "E";
  return predWinner === realWinner ? POINTS.WINNER : POINTS.WRONG;
}

/** Calcula puntos de un partido eliminatorio (incluye penales) */
export function calcPointsElim(pred, penaltyPred, result) {
  if (
    !pred || !result ||
    pred.local == null || pred.visitante == null ||
    result.local == null || result.visitante == null
  ) return { pts: null, ptsPenal: null };

  const { local: pl, visitante: pv } = pred;
  const { local: rl, visitante: rv } = result;

  let pts;
  if (pl === rl && pv === rv) pts = 3;
  else {
    const predWinner = pl > pv ? "L" : pv > pl ? "V" : "E";
    const realWinner = rl > rv ? "L" : rv > rl ? "V" : "E";
    pts = predWinner === realWinner ? 1 : 0;
  }

  // +1 por penales: solo si hubo empate Y hay ganador marcado Y acertaste
  let ptsPenal = null;
  if (rl === rv && result.ganador && penaltyPred) {
    ptsPenal = penaltyPred === result.ganador ? 1 : 0;
  }

  return { pts, ptsPenal };
}

export function calcUserStats(predictions, results) {
  let pts = 0, exact = 0, winner = 0, wrong = 0, pending = 0;

  Object.entries(results).forEach(([partidoId, result]) => {
    const pred = predictions[partidoId];
    if (!pred) return;

    const esElim = String(partidoId).startsWith("P");

    if (esElim) {
      const penaltyPred = predictions[`${partidoId}_penal`] ?? null;
      const { pts: p, ptsPenal } = calcPointsElim(pred, penaltyPred, result);
      if (p === null) { pending++; return; }
      pts += p + (ptsPenal ?? 0);
      if (p === 3) exact++;
      else if (p === 1) winner++;
      else wrong++;
    } else {
      const p = calcPoints(pred, result);
      if (p === null) { pending++; return; }
      pts += p;
      if (p === POINTS.EXACT) exact++;
      else if (p === POINTS.WINNER) winner++;
      else wrong++;
    }
  });

  return {
    pts, exact, winner, wrong, pending,
    predCount: Object.keys(predictions).filter(k => !k.includes("_penal")).length,
  };
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
