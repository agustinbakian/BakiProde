import { useState, useEffect, useCallback } from "react";
import { Flag } from "../components/Flag";
import { PARTIDOS_GRUPOS, GRUPOS } from "../lib/fixture";
import { savePrediction, subscribeToPredictions, subscribeToResults, calcPoints } from "../lib/db";
import { POINTS } from "../lib/config";

const GRUPOS_KEYS = Object.keys(GRUPOS);

function getPartidoStyle(pts, hasPred, isFinished) {
  if (!isFinished) {
    return {
      background: hasPred ? "#111827" : "#0D1424",
      border: hasPred ? "1px solid #F2C116" : "1px solid #1E2A45",
      borderLeft: hasPred ? "3px solid #F2C116" : "1px solid #1E2A45",
    };
  }
  if (pts === POINTS.EXACT)  return { background: "#1A1500", border: "1px solid #F2C116", borderLeft: "3px solid #F2C116" };
  if (pts === POINTS.WINNER) return { background: "#0D1A0D", border: "1px solid #2E7D32", borderLeft: "3px solid #4CAF50" };
  if (hasPred)               return { background: "#1A0A0A", border: "1px solid #5D1A1A", borderLeft: "3px solid #B71C1C" };
  return { background: "#0D1424", border: "1px solid #1E2A45" };
}

function PtsChip({ pts }) {
  if (pts === null) return null;
  if (pts === POINTS.EXACT)
    return <span style={{ background: "#2A1E05", color: "#F2C116", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>+3</span>;
  if (pts === POINTS.WINNER)
    return <span style={{ background: "#0D1F0D", color: "#4CAF50", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>+1</span>;
  return <span style={{ background: "#1F0D0D", color: "#EF5350", fontSize: 11, fontWeight: 700, padding: "3px 8px", borderRadius: 20 }}>0</span>;
}

function ScoreInput({ value, onChange, disabled }) {
  return (
    <input
      type="number" min="0" max="20"
      value={value ?? ""}
      placeholder="—"
      disabled={disabled}
      onChange={(e) => onChange(e.target.value === "" ? null : parseInt(e.target.value, 10))}
      style={{
        width: 36, height: 36, textAlign: "center", fontSize: 16, fontWeight: 700,
        border: "1px solid #1E2A45", borderRadius: 8,
        background: disabled ? "#060C18" : "#111827",
        color: disabled ? "#3D5070" : "#fff",
        outline: "none",
      }}
    />
  );
}

export function FixturePage({ user }) {
  const [predictions, setPredictions] = useState({});
  const [results,     setResults]     = useState({});
  const [grupo,       setGrupo]       = useState("todos");
  const [drafts,      setDrafts]      = useState({});

  useEffect(() => {
    const u1 = subscribeToPredictions(user.uid, setPredictions);
    const u2 = subscribeToResults(setResults);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const handleScore = useCallback((partidoId, side, val) => {
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
  }, [predictions, user.uid]);

  const filtered = grupo === "todos" ? PARTIDOS_GRUPOS : PARTIDOS_GRUPOS.filter((p) => p.grupo === grupo);
  const byDay = filtered.reduce((acc, p) => {
    if (!acc[p.fecha]) acc[p.fecha] = [];
    acc[p.fecha].push(p);
    return acc;
  }, {});

  return (
    <div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#5A7298", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: 600 }}>Grupo</span>
        {["todos", ...GRUPOS_KEYS].map((g) => (
          <button
            key={g}
            onClick={() => setGrupo(g)}
            style={{
              padding: "4px 10px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              background: grupo === g ? "#F2C116" : "transparent",
              color: grupo === g ? "#0A0F1E" : "#5A7298",
              border: `1px solid ${grupo === g ? "#F2C116" : "#1E2A45"}`,
              fontWeight: grupo === g ? 700 : 500,
            }}
          >
            {g === "todos" ? "Todos" : g}
          </button>
        ))}
      </div>

      {Object.entries(byDay).map(([fecha, partidos]) => (
        <div key={fecha}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#5A7298",
            textTransform: "uppercase", letterSpacing: "1px",
            padding: "10px 0 6px", borderBottom: "1px solid #1E2A45",
            marginBottom: 8, display: "flex", alignItems: "center", gap: 8,
          }}>
            {fecha}
            <span style={{ background: "#1E2A45", borderRadius: 6, padding: "2px 7px", fontSize: 10, color: "#3D5070", fontWeight: 600, textTransform: "none", letterSpacing: 0 }}>
              {partidos.length} partido{partidos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {partidos.map((p) => {
            const pred      = drafts[p.id] ?? predictions[p.id] ?? {};
            const res       = results[p.id];
            const hasPred   = pred.local != null && pred.visitante != null;
            const pts       = res && hasPred ? calcPoints(pred, res) : null;
            const isFinished = !!res;
            const cardStyle = getPartidoStyle(pts, hasPred, isFinished);

            return (
              <div key={p.id} style={{
                ...cardStyle,
                borderRadius: 12, padding: "10px 14px",
                marginBottom: 6, display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{ minWidth: 44, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#5A7298" }}>{p.hora}</div>
                  <div style={{
                    fontSize: 10, background: "#1E2A45", color: "#F2C116",
                    borderRadius: 20, padding: "1px 5px", fontWeight: 700, marginTop: 3, display: "inline-block",
                  }}>G{p.grupo}</div>
                </div>

                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.local}
                  </span>
                  <Flag country={p.local} size={22} />
                </div>

                {isFinished ? (
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", minWidth: 52, textAlign: "center" }}>
                    {res.local} : {res.visitante}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <ScoreInput value={pred.local}     onChange={(v) => handleScore(p.id, "local", v)}     disabled={false} />
                    <span style={{ fontSize: 11, color: "#3D5070", fontWeight: 700 }}>:</span>
                    <ScoreInput value={pred.visitante} onChange={(v) => handleScore(p.id, "visitante", v)} disabled={false} />
                  </div>
                )}

                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Flag country={p.visitante} size={22} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.visitante}
                  </span>
                </div>

                <div style={{ minWidth: 36, textAlign: "right" }}>
                  {isFinished && hasPred
                    ? <PtsChip pts={pts} />
                    : hasPred
                      ? <span style={{ fontSize: 10, color: "#3D5070" }}>por jugar</span>
                      : null
                  }
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
