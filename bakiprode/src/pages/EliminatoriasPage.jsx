import { useState, useEffect } from "react";
import { subscribeToResults } from "../lib/db";
import { PARTIDOS_GRUPOS, GRUPOS, BRACKET_ELIM } from "../lib/fixture";

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

// Columnas por fase para la grilla
const COLS = { R32: 4, R16: 4, QF: 2, SF: 2, "3P": 1, F: 1 };

function ElimCard({ partido }) {
  return (
    <div style={{
      background: "#fff",
      border: "0.5px solid #eee",
      borderRadius: 10,
      padding: "10px 12px",
      fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, color: "#0F6E56", marginBottom: 3 }}>
        {partido.fecha}
      </div>
      <div style={{ color: "#444", lineHeight: 1.4 }}>
        {partido.label}
      </div>
    </div>
  );
}

export function EliminatoriasPage() {
  const [results, setResults] = useState({});

  useEffect(() => {
    return subscribeToResults(setResults);
  }, []);

  const totalGrupos = PARTIDOS_GRUPOS.length;
  const finalizados = PARTIDOS_GRUPOS.filter((p) => results[p.id]).length;
  const gruposCompletos = finalizados === totalGrupos;
  const pct = Math.round((finalizados / totalGrupos) * 100);

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
            Los cruces se completan automáticamente cuando terminen todos los partidos de grupos.
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
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              margin: "20px 0 10px",
            }}>
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
              {fase.partidos.map((p) => (
                <ElimCard key={p.id} partido={p} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
