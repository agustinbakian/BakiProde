import { useState, useEffect } from "react";
import { subscribeToResults, subscribeToPredictions, savePrediction, savePenaltyPred, calcPointsElim } from "../lib/db";
import { BRACKET_ELIM, FLAG_ISO } from "../lib/fixture";

// ── buildWinnerIndex — encadena ganadores fase a fase ─────────────────────────
function buildWinnerIndex(results) {
  const winners = {};

  BRACKET_ELIM.forEach((fase) => {
    fase.partidos.forEach((p) => {
      // Dieciseisavos: tienen local/visitante reales hardcodeados en fixture
      if (p.local && p.visitante) {
        const res = results[p.id];
        if (res?.ganador) {
          winners[p.id] = { local: p.local, visitante: p.visitante, ganador: res.ganador };
        } else if (res && res.local !== res.visitante) {
          winners[p.id] = {
            local: p.local, visitante: p.visitante,
            ganador: res.local > res.visitante ? p.local : p.visitante,
          };
        } else {
          winners[p.id] = { local: p.local, visitante: p.visitante, ganador: null };
        }
        return;
      }

      // Octavos en adelante: resolver desde winners anteriores
      const m = p.label.match(/^(Gan\.|Per\.) (P\d+) vs (Gan\.|Per\.) (P\d+)$/);
      if (!m) return;

      const getTeam = (w, tipo) => {
        if (!w) return null;
        if (tipo === "Gan.") return w.ganador;
        if (!w.ganador) return null;
        return w.ganador === w.local ? w.visitante : w.local;
      };

      const w1 = winners[m[2]];
      const w2 = winners[m[4]];
      const e1 = getTeam(w1, m[1]);
      const e2 = getTeam(w2, m[3]);

      if (e1 && e2) {
        const res = results[p.id];
        if (res?.ganador) {
          winners[p.id] = { local: e1, visitante: e2, ganador: res.ganador };
        } else if (res && res.local !== res.visitante) {
          winners[p.id] = { local: e1, visitante: e2, ganador: res.local > res.visitante ? e1 : e2 };
        } else {
          winners[p.id] = { local: e1, visitante: e2, ganador: null };
        }
      }
    });
  });

  return winners;
}

// ── Flag ──────────────────────────────────────────────────────────────────────
function Flag({ country }) {
  const code = FLAG_ISO[country];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/20x15/${code}.png`}
      width={20} height={15} alt={country}
      style={{ borderRadius: 2, objectFit: "cover", border: "0.5px solid rgba(0,0,0,0.1)", flexShrink: 0 }}
    />
  );
}

// ── ScoreInput ────────────────────────────────────────────────────────────────
function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value ?? ""}
      placeholder="—"
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
      style={{
        width: 32, height: 32, textAlign: "center", fontSize: 14, fontWeight: 600,
        border: "1px solid #1E2A45", borderRadius: 8,
        background: disabled ? "#060C18" : "#111827",
        color: disabled ? "#3D5070" : "#fff",
        outline: "none",
      }}
    />
  );
}

// ── ElimCard ──────────────────────────────────────────────────────────────────
function ElimCard({ partido, winnerInfo, pred, penaltyPred, onSave, onSavePenalty, result }) {
  const local     = winnerInfo?.local     ?? null;
  const visitante = winnerInfo?.visitante ?? null;
  const hasTeams  = local && visitante;

  const partidoDate = new Date(`${partido.fechaISO}T${partido.hora}:00-03:00`);
  const isStarted   = Date.now() >= partidoDate.getTime();
  const locked      = isStarted || !!result;
  const hasPred     = pred && pred.local != null && pred.visitante != null;

  // Calcular puntos
  const { pts, ptsPenal } = result && hasPred
    ? calcPointsElim(pred, penaltyPred ?? null, result)
    : { pts: null, ptsPenal: null };
  const totalPts = (pts ?? 0) + (ptsPenal ?? 0);

  // Color del borde según resultado
  let borderColor = hasPred ? "#F2C116" : "#1E2A45";
  let borderLeftColor = hasPred ? "#F2C116" : "#1E2A45";
  if (result && hasPred) {
    if (totalPts >= 3)      { borderColor = "#2E7D32"; borderLeftColor = "#4CAF50"; }
    else if (totalPts >= 1) { borderColor = "#F9A825"; borderLeftColor = "#F2C116"; }
    else                    { borderColor = "#B71C1C"; borderLeftColor = "#EF5350"; }
  }

  return (
    <div style={{
      background: "#111827",
      border: `1px solid ${borderColor}`,
      borderLeft: `3px solid ${borderLeftColor}`,
      borderRadius: 12,
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: 10, fontWeight: 600, color: "#5A7298", marginBottom: 6 }}>
        {partido.fecha} · {partido.hora}hs
      </div>

      {hasTeams ? (
        <>
          {/* Equipo local */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Flag country={local} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E8EDF5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {local}
            </span>
          </div>

          {/* Score */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", margin: "6px 0" }}>
            {result ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                  {result.local} : {result.visitante}
                </div>
                {result.ganador && (
                  <div style={{ fontSize: 10, color: "#F2C116", marginTop: 2 }}>
                    Penales: {result.ganador} ✓
                  </div>
                )}
              </div>
            ) : locked ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: "#3D5070" }}>
                {hasPred ? `${pred.local} : ${pred.visitante}` : "— : —"}
              </span>
            ) : (
              <>
                <ScoreInput value={pred?.local ?? null}     onChange={(v) => onSave("local", v)}     disabled={false} />
                <span style={{ fontSize: 11, color: "#3D5070", fontWeight: 700 }}>:</span>
                <ScoreInput value={pred?.visitante ?? null} onChange={(v) => onSave("visitante", v)} disabled={false} />
              </>
            )}
          </div>

          {/* Equipo visitante */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <Flag country={visitante} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#E8EDF5", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {visitante}
            </span>
          </div>

          {/* Selector ganador penales */}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1E2A45" }}>
            <div style={{ fontSize: 10, color: "#5A7298", marginBottom: 4, textAlign: "center" }}>
              Ganador en penales
            </div>
            <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
              {[local, visitante].map((eq) => {
                const isSelected = penaltyPred === eq;
                const isCorrect  = result?.ganador && result.ganador === eq && isSelected;
                const isWrong    = result?.ganador && result.ganador !== eq && isSelected;
                return (
                  <button
                    key={eq}
                    onClick={() => !locked && onSavePenalty(eq)}
                    disabled={locked}
                    style={{
                      padding: "3px 8px", fontSize: 10, fontWeight: 700, borderRadius: 20,
                      cursor: locked ? "default" : "pointer",
                      background: isCorrect ? "#1B5E20" : isWrong ? "#B71C1C" : isSelected ? "#F2C116" : "transparent",
                      color: isCorrect ? "#A5D6A7" : isWrong ? "#FFCDD2" : isSelected ? "#0A0F1E" : "#5A7298",
                      border: `1px solid ${isCorrect ? "#4CAF50" : isWrong ? "#EF5350" : isSelected ? "#F2C116" : "#1E2A45"}`,
                    }}
                  >
                    {isCorrect ? "✓ " : ""}{eq}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Puntos */}
          {result && hasPred && (
            <div style={{ marginTop: 6, textAlign: "center" }}>
              {totalPts > 0
                ? <span style={{ fontSize: 11, fontWeight: 800, color: totalPts >= 3 ? "#4CAF50" : "#F2C116" }}>+{totalPts} pts</span>
                : <span style={{ fontSize: 11, color: "#EF5350", fontWeight: 700 }}>✗ 0 pts</span>
              }
              {ptsPenal !== null && (
                <span style={{ fontSize: 10, color: "#5A7298", marginLeft: 4 }}>
                  ({ptsPenal > 0 ? "+1 penales" : "0 penales"})
                </span>
              )}
            </div>
          )}

          {/* Estado */}
          {!result && (
            <div style={{ marginTop: 4, textAlign: "right" }}>
              {locked && hasPred
                ? <span style={{ fontSize: 10, color: "#F2C116" }}>🔒 en juego</span>
                : hasPred
                  ? <span style={{ fontSize: 10, color: "#3D5070" }}>por jugar</span>
                  : null
              }
            </div>
          )}
        </>
      ) : (
        <div style={{ fontSize: 11, color: "#5A7298", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
          {partido.label}
        </div>
      )}
    </div>
  );
}

const COLS = { R32: 4, R16: 4, QF: 2, SF: 2, "3P": 1, F: 1 };

// ── EliminatoriasPage ─────────────────────────────────────────────────────────
export function EliminatoriasPage({ user }) {
  const [results,       setResults]       = useState({});
  const [predictions,   setPredictions]   = useState({});
  const [drafts,        setDrafts]        = useState({});
  const [penaltyDrafts, setPenaltyDrafts] = useState({});

  useEffect(() => {
    const u1 = subscribeToResults(setResults);
    const u2 = subscribeToPredictions(user.uid, setPredictions);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const winnerIndex = buildWinnerIndex(results);

  function handleSave(partidoId, side, val) {
    setDrafts((prev) => {
      const current = prev[partidoId] ?? {
        local:     predictions[partidoId]?.local     ?? null,
        visitante: predictions[partidoId]?.visitante ?? null,
      };
      const updated = { ...current, [side]: val };
      if (updated.local !== null && updated.visitante !== null) {
        savePrediction(user.uid, partidoId, updated.local, updated.visitante);
      }
      return { ...prev, [partidoId]: updated };
    });
  }

  function handlePenalty(partidoId, equipo) {
    setPenaltyDrafts((prev) => ({ ...prev, [partidoId]: equipo }));
    savePenaltyPred(user.uid, partidoId, equipo);
  }

  return (
    <div>
      {BRACKET_ELIM.map((fase) => {
        const cols = COLS[fase.ronda] || 2;
        return (
          <div key={fase.ronda}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px" }}>
              <span style={{
                background: "#1E2A45", color: "#F2C116", fontSize: 12,
                fontWeight: 600, padding: "3px 12px", borderRadius: 20,
              }}>
                {fase.fase}
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 8, marginBottom: 4,
            }}>
              {fase.partidos.map((p) => {
                const pred        = drafts[p.id]        ?? predictions[p.id];
                const penaltyPred = penaltyDrafts[p.id] ?? predictions[`${p.id}_penal`];
                const result      = results[p.id];
                const winnerInfo  = winnerIndex[p.id];
                return (
                  <ElimCard
                    key={p.id}
                    partido={p}
                    winnerInfo={winnerInfo}
                    pred={pred}
                    penaltyPred={penaltyPred}
                    result={result}
                    onSave={(side, val) => handleSave(p.id, side, val)}
                    onSavePenalty={(eq) => handlePenalty(p.id, eq)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
