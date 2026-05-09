import { useState, useEffect } from "react";
import { subscribeToResults, subscribeToPredictions, savePrediction } from "../lib/db";
import { PARTIDOS_GRUPOS, GRUPOS, BRACKET_ELIM, FLAG_ISO } from "../lib/fixture";

function calcClasificados(results) {
  const tablas = {};
  Object.keys(GRUPOS).forEach((g) => { tablas[g] = {}; });

  PARTIDOS_GRUPOS.forEach((p) => {
    const res = results[p.id];
    if (!res) return;
    const { local: rl, visitante: rv } = res;
    [p.local, p.visitante].forEach((eq) => {
      if (!tablas[p.grupo][eq]) tablas[p.grupo][eq] = { pts: 0, gf: 0, gc: 0, dg: 0 };
    });
    const tl = tablas[p.grupo][p.local];
    const tv = tablas[p.grupo][p.visitante];
    tl.gf += rl; tl.gc += rv; tl.dg += rl - rv;
    tv.gf += rv; tv.gc += rl; tv.dg += rv - rl;
    if (rl > rv)      { tl.pts += 3; }
    else if (rl < rv) { tv.pts += 3; }
    else              { tl.pts += 1; tv.pts += 1; }
  });

  const clasificados = {};
  Object.entries(tablas).forEach(([g, equipos]) => {
    const sorted = Object.entries(equipos)
      .sort(([, a], [, b]) => b.pts - a.pts || b.dg - a.dg || b.gf - a.gf);
    clasificados[g] = sorted.map(([name]) => name);
  });
  return clasificados;
}

function Flag({ country }) {
  const code = FLAG_ISO[country];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/20x15/${code}.png`}
      width={20} height={15}
      alt={country}
      style={{ borderRadius: 2, objectFit: "cover", border: "0.5px solid rgba(0,0,0,0.1)", flexShrink: 0 }}
    />
  );
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
        width: 32, height: 32, textAlign: "center", fontSize: 14, fontWeight: 600,
        border: "1px solid #ddd", borderRadius: 8,
        background: disabled ? "#f5f5f0" : "#fafafa",
        color: disabled ? "#999" : "#111",
        outline: "none",
      }}
    />
  );
}

function ElimCard({ partido, equipos, pred, onSave, result }) {
  const [local, visitante] = equipos || [null, null];
  const locked = !!result;
  const hasPred = pred && pred.local != null && pred.visitante != null;

  return (
    <div style={{
      background: "#fff",
      border: hasPred ? "1.5px solid #1D9E75" : "0.5px solid #eee",
      borderRadius: 10,
      padding: "10px 12px",
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#0F6E56", marginBottom: 6 }}>
        {partido.fecha}
      </div>

      {local && visitante ? (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Flag country={local} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#111", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {local}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", margin: "6px 0" }}>
            {locked ? (
              <span style={{ fontSize: 14, fontWeight: 700, color: "#111" }}>
                {result.local} : {result.visitante}
              </span>
            ) : (
              <>
                <ScoreInput value={pred?.local ?? null}     onChange={(v) => onSave("local", v)}     disabled={locked} />
                <span style={{ fontSize: 11, color: "#ccc" }}>:</span>
                <ScoreInput value={pred?.visitante ?? null} onChange={(v) => onSave("visitante", v)} disabled={locked} />
              </>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
            <Flag country={visitante} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#111", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {visitante}
            </span>
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: "#aaa", fontStyle: "italic", textAlign: "center", padding: "8px 0" }}>
          {partido.label}
        </div>
      )}
    </div>
  );
}

const COLS = { R32: 4, R16: 4, QF: 2, SF: 2, "3P": 1, F: 1 };

export function EliminatoriasPage({ user }) {
  const [results,     setResults]     = useState({});
  const [predictions, setPredictions] = useState({});
  const [drafts,      setDrafts]      = useState({});

  useEffect(() => {
    const u1 = subscribeToResults(setResults);
    const u2 = subscribeToPredictions(user.uid, setPredictions);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const totalGrupos = PARTIDOS_GRUPOS.length;
  const finalizados = PARTIDOS_GRUPOS.filter((p) => results[p.id]).length;
  const gruposCompletos = finalizados === totalGrupos;
  const pct = Math.round((finalizados / totalGrupos) * 100);

  const clasificados = gruposCompletos ? calcClasificados(results) : null;

  function getEquipos(label) {
    if (!clasificados) return null;
    const m = label.match(/^(\d)º ([A-L]) vs (\d)º ([A-L])$/);
    if (m) {
      const e1 = clasificados[m[2]]?.[parseInt(m[1]) - 1];
      const e2 = clasificados[m[4]]?.[parseInt(m[3]) - 1];
      if (e1 && e2) return [e1, e2];
    }
    return null;
  }

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

  return (
    <div>
      {!gruposCompletos && (
        <div style={{ marginBottom: 24 }}>
          <div style={{
            background: "#f5f5f0", borderRadius: 10, padding: "12px 16px",
            fontSize: 13, color: "#666", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>🔒</span>
            Los equipos aparecen automáticamente cuando terminen todos los partidos de grupos.
          </div>
          <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
            {finalizados} de {totalGrupos} partidos de grupos finalizados
          </div>
          <div style={{ background: "#eee", borderRadius: 20, height: 6 }}>
            <div style={{
              background: "#1D9E75", height: 6, borderRadius: 20,
              width: `${pct}%`, transition: "width 0.4s"
            }} />
          </div>
        </div>
      )}

      {BRACKET_ELIM.map((fase) => {
        const cols = COLS[fase.ronda] || 2;
        return (
          <div key={fase.ronda}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "20px 0 10px" }}>
              <span style={{
                background: "#E1F5EE", color: "#085041", fontSize: 12,
                fontWeight: 600, padding: "3px 12px", borderRadius: 20,
              }}>
                {fase.fase}
              </span>
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
              gap: 8,
              marginBottom: 4,
            }}>
              {fase.partidos.map((p) => {
                const pred   = drafts[p.id] ?? predictions[p.id];
                const result = results[p.id];
                const equipos = getEquipos(p.label);
                return (
                  <ElimCard
                    key={p.id}
                    partido={p}
                    equipos={equipos}
                    pred={pred}
                    result={result}
                    onSave={(side, val) => handleSave(p.id, side, val)}
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
