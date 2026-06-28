import { useState, useEffect } from "react";
import { Flag } from "../components/Flag";
import { BRACKET_ELIM } from "../lib/fixture";
import { savePrediction, subscribeToPredictions, subscribeToResults, savePenaltyPred, calcPointsElim } from "../lib/db";

// ── buildWinnerIndex ──────────────────────────────────────────────────────────
function buildWinnerIndex(results) {
  const winners = {};

  BRACKET_ELIM.forEach((fase) => {
    fase.partidos.forEach((p) => {
      if (p.local && p.visitante) {
        const res = results[p.id];
        if (res?.ganador) {
          winners[p.id] = { local: p.local, visitante: p.visitante, ganador: res.ganador };
        } else if (res && res.local !== res.visitante) {
          winners[p.id] = { local: p.local, visitante: p.visitante, ganador: res.local > res.visitante ? p.local : p.visitante };
        } else {
          winners[p.id] = { local: p.local, visitante: p.visitante, ganador: null };
        }
        return;
      }

      const m = p.label.match(/^(Gan\.|Per\.) (P\d+) vs (Gan\.|Per\.) (P\d+)$/);
      if (!m) return;

      const getTeam = (w, tipo) => {
        if (!w) return null;
        if (tipo === "Gan.") return w.ganador;
        if (!w.ganador) return null;
        return w.ganador === w.local ? w.visitante : w.local;
      };

      const e1 = getTeam(winners[m[2]], m[1]);
      const e2 = getTeam(winners[m[4]], m[3]);

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

// ── Estilos de card (igual que grupos) ────────────────────────────────────────
function getCardStyle(totalPts, hasPred, isFinished) {
  if (!isFinished) {
    return {
      background: hasPred ? "#111827" : "#0D1424",
      border: hasPred ? "1px solid #F2C116" : "1px solid #1E2A45",
      borderLeft: hasPred ? "3px solid #F2C116" : "1px solid #1E2A45",
    };
  }
  if (totalPts >= 3) return { background: "#0A1F0A", border: "1px solid #2E7D32", borderLeft: "4px solid #4CAF50" };
  if (totalPts >= 1) return { background: "#1A1500", border: "1px solid #F9A825", borderLeft: "4px solid #F2C116" };
  if (hasPred)       return { background: "#1F0A0A", border: "1px solid #B71C1C", borderLeft: "4px solid #EF5350" };
  return { background: "#0D1424", border: "1px solid #1E2A45" };
}

function PtsChip({ pts, ptsPenal }) {
  if (pts === null) return null;
  const total = pts + (ptsPenal ?? 0);
  if (pts === 3)
    return <span style={{ background: "#1B5E20", color: "#A5D6A7", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>+{total} ✓</span>;
  if (pts === 1 || ptsPenal > 0)
    return <span style={{ background: "#F57F17", color: "#FFF9C4", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>+{total}</span>;
  return <span style={{ background: "#B71C1C", color: "#FFCDD2", fontSize: 12, fontWeight: 800, padding: "3px 10px", borderRadius: 20 }}>✗ 0</span>;
}

function ScoreInput({ value, onChange }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value ?? ""}
      placeholder="—"
      onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
      style={{
        width: 36, height: 36, textAlign: "center", fontSize: 16, fontWeight: 700,
        border: "1px solid #1E2A45", borderRadius: 8,
        background: "#111827", color: "#fff", outline: "none",
      }}
    />
  );
}

// ── PartidoElim — mismo layout horizontal que grupos ─────────────────────────
function PartidoElim({ partido, winnerInfo, pred, penaltyPred, onSave, onSavePenalty, result }) {
  const local     = winnerInfo?.local     ?? null;
  const visitante = winnerInfo?.visitante ?? null;
  const hasTeams  = local && visitante;

  const partidoDate = new Date(`${partido.fechaISO}T${partido.hora}:00-03:00`);
  const isStarted   = Date.now() >= partidoDate.getTime();
  const isFinished  = !!result;
  const locked      = isStarted || isFinished;
  const hasPred     = pred && pred.local != null && pred.visitante != null;

  const { pts, ptsPenal } = isFinished && hasPred
    ? calcPointsElim(pred, penaltyPred ?? null, result)
    : { pts: null, ptsPenal: null };
  const totalPts = (pts ?? 0) + (ptsPenal ?? 0);

  const cardStyle = getCardStyle(totalPts, hasPred, isFinished);

  return (
    <div style={{ ...cardStyle, borderRadius: 12, padding: "10px 14px", marginBottom: 6 }}>
      {/* Fila principal */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* Hora + fase */}
        <div style={{ minWidth: 44, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#5A7298" }}>{partido.hora}</div>
          <div style={{
            fontSize: 9, background: "#1E2A45", color: "#F2C116",
            borderRadius: 20, padding: "1px 5px", fontWeight: 700, marginTop: 3, display: "inline-block",
          }}>ELIM</div>
        </div>

        {/* Equipo local */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", minWidth: 0 }}>
          {hasTeams ? (
            <>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {local}
              </span>
              <Flag country={local} size={22} />
            </>
          ) : (
            <span style={{ fontSize: 11, color: "#5A7298", fontStyle: "italic" }}>Por definir</span>
          )}
        </div>

        {/* Centro: resultado o inputs */}
        {hasTeams ? (
          isFinished ? (
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", minWidth: 52, textAlign: "center" }}>
              {result.local} : {result.visitante}
            </div>
          ) : locked ? (
            <div style={{ fontSize: 15, fontWeight: 700, minWidth: 52, textAlign: "center", color: "#3D5070" }}>
              {hasPred
                ? <>{pred.local} <span style={{ fontSize: 11 }}>:</span> {pred.visitante}</>
                : "— : —"
              }
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              <ScoreInput value={pred?.local ?? null}     onChange={(v) => onSave("local", v)} />
              <span style={{ fontSize: 11, color: "#3D5070", fontWeight: 700 }}>:</span>
              <ScoreInput value={pred?.visitante ?? null} onChange={(v) => onSave("visitante", v)} />
            </div>
          )
        ) : (
          <div style={{ fontSize: 13, color: "#3D5070", minWidth: 52, textAlign: "center" }}>— : —</div>
        )}

        {/* Equipo visitante */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {hasTeams ? (
            <>
              <Flag country={visitante} size={22} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {visitante}
              </span>
            </>
          ) : (
            <span style={{ fontSize: 11, color: "#5A7298", fontStyle: "italic" }}>Por definir</span>
          )}
        </div>

        {/* Chip de puntos / estado */}
        <div style={{ minWidth: 36, textAlign: "right" }}>
          {isFinished && hasPred
            ? <PtsChip pts={pts} ptsPenal={ptsPenal} />
            : locked && hasPred
              ? <span style={{ fontSize: 10, color: "#F2C116" }}>🔒 en juego</span>
              : hasPred
                ? <span style={{ fontSize: 10, color: "#3D5070" }}>por jugar</span>
                : null
          }
        </div>
      </div>

      {/* Pronóstico + penales debajo */}
      {hasTeams && locked && hasPred && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
          {/* Pronóstico */}
          <span style={{ fontSize: 11, color: "#3D5070" }}>
            tu pronóstico: <span style={{ color: "#5A7298", fontWeight: 700 }}>{pred.local} - {pred.visitante}</span>
          </span>

          {/* Selector penales */}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 10, color: "#5A7298" }}>Penales:</span>
            {[local, visitante].map((eq) => {
              const isSelected = penaltyPred === eq;
              const isCorrect  = isFinished && result?.ganador === eq && isSelected;
              const isWrong    = isFinished && result?.ganador && result.ganador !== eq && isSelected;
              return (
                <button
                  key={eq}
                  onClick={() => !locked && onSavePenalty(eq)}
                  disabled={locked}
                  style={{
                    padding: "2px 8px", fontSize: 10, fontWeight: 700, borderRadius: 20,
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
      )}

      {/* Selector penales cuando no está bloqueado */}
      {hasTeams && !locked && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4 }}>
          <span style={{ fontSize: 10, color: "#5A7298" }}>Penales:</span>
          {[local, visitante].map((eq) => {
            const isSelected = penaltyPred === eq;
            return (
              <button
                key={eq}
                onClick={() => onSavePenalty(eq)}
                style={{
                  padding: "2px 8px", fontSize: 10, fontWeight: 700, borderRadius: 20,
                  cursor: "pointer",
                  background: isSelected ? "#F2C116" : "transparent",
                  color: isSelected ? "#0A0F1E" : "#5A7298",
                  border: `1px solid ${isSelected ? "#F2C116" : "#1E2A45"}`,
                }}
              >
                {eq}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

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
      {BRACKET_ELIM.map((fase) => (
        <div key={fase.ronda}>
          {/* Header de fase */}
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#5A7298",
            textTransform: "uppercase", letterSpacing: "1px",
            padding: "10px 0 6px", borderBottom: "1px solid #1E2A45",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
          }}>
            {fase.fase}
            <span style={{ background: "#1E2A45", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#3D5070", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
              {fase.partidos.length} partido{fase.partidos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Partidos */}
          {fase.partidos.map((p) => {
            const pred        = drafts[p.id]        ?? predictions[p.id];
            const penaltyPred = penaltyDrafts[p.id] ?? predictions[`${p.id}_penal`];
            const result      = results[p.id];
            const winnerInfo  = winnerIndex[p.id];
            return (
              <PartidoElim
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
      ))}
    </div>
  );
}
