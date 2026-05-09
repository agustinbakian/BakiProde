import { useState, useEffect, useCallback } from "react";
import { Flag } from "../components/Flag";
import { PARTIDOS_GRUPOS, GRUPOS } from "../lib/fixture";
import { savePrediction, subscribeToPredictions, subscribeToResults, calcPoints } from "../lib/db";
import { POINTS } from "../lib/config";

const GRUPOS_KEYS = Object.keys(GRUPOS);

function PtsChip({ pts }) {
  if (pts === null) return null;
  if (pts === POINTS.EXACT)
    return <span style={{ background: "#E1F5EE", color: "#085041", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>+3</span>;
  if (pts === POINTS.WINNER)
    return <span style={{ background: "#FAEEDA", color: "#633806", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>+1</span>;
  return <span style={{ background: "#f0f0ed", color: "#888", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20 }}>0</span>;
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
        width: 36, height: 36, textAlign: "center", fontSize: 16, fontWeight: 600,
        border: "1px solid #ddd", borderRadius: 8,
        background: disabled ? "#f5f5f0" : "#fafafa",
        color: disabled ? "#999" : "#111",
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

  const filtered = grupo === "todos"
    ? PARTIDOS_GRUPOS
    : PARTIDOS_GRUPOS.filter((p) => p.grupo === grupo);

  const byDay = filtered.reduce((acc, p) => {
    if (!acc[p.fecha]) acc[p.fecha] = [];
    acc[p.fecha].push(p);
    return acc;
  }, {});

  return (
    <div>
      {/* Filtros por grupo */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "#888" }}>Grupo:</span>
        {["todos", ...GRUPOS_KEYS].map((g) => (
          <button
            key={g}
            onClick={() => setGrupo(g)}
            style={{
              padding: "3px 10px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              background: grupo === g ? "#0F6E56" : "transparent",
              color: grupo === g ? "#E1F5EE" : "#666",
              border: `0.5px solid ${grupo === g ? "#0F6E56" : "#ddd"}`,
            }}
          >
            {g === "todos" ? "Todos" : g}
          </button>
        ))}
      </div>

      {Object.entries(byDay).map(([fecha, partidos]) => (
        <div key={fecha}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: "#888", padding: "10px 0 6px",
            borderBottom: "0.5px solid #eee", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            {fecha}
            <span style={{ background: "#f0f0ed", borderRadius: 6, padding: "1px 7px", fontSize: 11, color: "#aaa" }}>
              {partidos.length} partido{partidos.length !== 1 ? "s" : ""}
            </span>
          </div>

          {partidos.map((p) => {
            const pred    = drafts[p.id] ?? predictions[p.id] ?? {};
            const res     = results[p.id];
            const hasPred = pred.local != null && pred.visitante != null;
            const pts     = res && hasPred ? calcPoints(pred, res) : null;
            const locked  = !!res;

            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: hasPred ? "1.5px solid #1D9E75" : "0.5px solid #eee",
                  borderRadius: 12,
                  padding: "10px 14px",
                  marginBottom: 6,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {/* Hora + grupo */}
                <div style={{ minWidth: 44, textAlign: "center" }}>
                  <div style={{ fontSize: 11, color: "#aaa" }}>{p.hora}</div>
                  <div style={{
                    fontSize: 10, background: "#E1F5EE", color: "#085041",
                    borderRadius: 20, padding: "1px 5px", fontWeight: 600, marginTop: 3,
                  }}>G{p.grupo}</div>
                </div>

                {/* Equipo local */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", minWidth: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.local}
                  </span>
                  <Flag country={p.local} size={22} />
                </div>

                {/* Score */}
                {locked ? (
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#111", minWidth: 52, textAlign: "center" }}>
                    {res.local} : {res.visitante}
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                    <ScoreInput value={pred.local}     onChange={(v) => handleScore(p.id, "local", v)}     disabled={locked} />
                    <span style={{ fontSize: 11, color: "#ccc" }}>:</span>
                    <ScoreInput value={pred.visitante} onChange={(v) => handleScore(p.id, "visitante", v)} disabled={locked} />
                  </div>
                )}

                {/* Equipo visitante */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <Flag country={p.visitante} size={22} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {p.visitante}
                  </span>
                </div>

                {/* Puntos */}
                <div style={{ minWidth: 36, textAlign: "right" }}>
                  {res && hasPred
                    ? <PtsChip pts={pts} />
                    : hasPred
                      ? <span style={{ fontSize: 10, color: "#ccc" }}>por jugar</span>
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
