import { useState, useEffect } from "react";
import { subscribeToResults, subscribeToPredictions, savePrediction } from "../lib/db";
import { PARTIDOS_GRUPOS, GRUPOS, BRACKET_ELIM, FLAG_ISO } from "../lib/fixture";

// ── Tabla de grupos ───────────────────────────────────────────────────────────
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

// ── Resolver equipos de un partido eliminatorio ───────────────────────────────
// Construye un índice partidoId → ganador basado en resultados
function buildWinnerIndex(results, clasificados) {
  const winners = {}; // partidoId → nombre del equipo ganador

  // Primero resolvemos dieciseisavos desde grupos
  BRACKET_ELIM[0].partidos.forEach((p) => {
    // Intenta resolver desde clasificados (label tipo "1º A vs 2º B")
    const m = p.label.match(/^(\d)º ([A-L]) vs (\d)º ([A-L])$/);
    if (m && clasificados) {
      const e1 = clasificados[m[2]]?.[parseInt(m[1]) - 1];
      const e2 = clasificados[m[4]]?.[parseInt(m[3]) - 1];
      if (e1 && e2) {
        const res = results[p.id];
        if (res?.ganador) {
          winners[p.id] = { local: e1, visitante: e2, ganador: res.ganador };
        } else if (res && res.local !== res.visitante) {
          winners[p.id] = {
            local: e1, visitante: e2,
            ganador: res.local > res.visitante ? e1 : e2,
          };
        } else if (res) {
          winners[p.id] = { local: e1, visitante: e2, ganador: null };
        }
      }
    }
  });

  // Luego resolvemos el resto encadenando (octavos, cuartos, semis, final)
  BRACKET_ELIM.slice(1).forEach((fase) => {
    fase.partidos.forEach((p) => {
      // label tipo "Gan. P74 vs Gan. P77" o "Per. P101 vs Per. P102"
      const m = p.label.match(/^(Gan\.|Per\.) (P\d+) vs (Gan\.|Per\.) (P\d+)$/);
      if (!m) return;
      const tipo1 = m[1]; // "Gan." o "Per."
      const id1   = m[2];
      const tipo2 = m[3];
      const id2   = m[4];

      const w1 = winners[id1];
      const w2 = winners[id2];

      const getTeam = (w, tipo) => {
        if (!w) return null;
        if (tipo === "Gan.") return w.ganador;
        // Per. = el perdedor
        if (!w.ganador) return null;
        return w.ganador === w.local ? w.visitante : w.local;
      };

      const e1 = getTeam(w1, tipo1);
      const e2 = getTeam(w2, tipo2);

      if (e1 && e2) {
        const res = results[p.id];
        if (res?.ganador) {
          winners[p.id] = { local: e1, visitante: e2, ganador: res.ganador };
        } else if (res && res.local !== res.visitante) {
          winners[p.id] = {
            local: e1, visitante: e2,
            ganador: res.local > res.visitante ? e1 : e2,
          };
        } else if (res) {
          winners[p.id] = { local: e1, visitante: e2, ganador: null };
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
function ElimCard({ partido, winnerInfo, pred, onSave, result }) {
  const local     = winnerInfo?.local     ?? null;
  const visitante = winnerInfo?.visitante ?? null;
  const hasTeams  = local && visitante;

  const partidoDate = new Date(`${partido.fechaISO}T${partido.hora}:00-03:00`);
  const isStarted   = Date.now() >= partidoDate.getTime();
  const locked      = isStarted || !!result;
  const hasPred     = pred && pred.local != null && pred.visitante != null;

  return (
    <div style={{
      background: "#111827",
      border: hasPred ? "1px solid #F2C116" : "1px solid #1E2A45",
      borderLeft: hasPred ? "3px solid #F2C116" : "1px solid #1E2A45",
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
              <span style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>
                {result.local} : {result.visitante}
                {result.ganador && <span style={{ fontSize: 10, color: "#F2C116", marginLeft: 6 }}>({result.ganador} ✓)</span>}
              </span>
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

          {/* Estado */}
          <div style={{ marginTop: 6, textAlign: "right" }}>
            {result && hasPred
              ? null // podrías agregar PtsChip acá en el futuro
              : locked && hasPred
                ? <span style={{ fontSize: 10, color: "#F2C116" }}>🔒 en juego</span>
                : hasPred
                  ? <span style={{ fontSize: 10, color: "#3D5070" }}>por jugar</span>
                  : null
            }
          </div>
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
  const [results,     setResults]     = useState({});
  const [predictions, setPredictions] = useState({});
  const [drafts,      setDrafts]      = useState({});

  useEffect(() => {
    const u1 = subscribeToResults(setResults);
    const u2 = subscribeToPredictions(user.uid, setPredictions);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const totalGrupos  = PARTIDOS_GRUPOS.length;
  const finalizados  = PARTIDOS_GRUPOS.filter((p) => results[p.id]).length;
  const gruposCompletos = finalizados === totalGrupos;
  const pct = Math.round((finalizados / totalGrupos) * 100);

  const clasificados = gruposCompletos ? calcClasificados(results) : null;
  const winnerIndex  = buildWinnerIndex(results, clasificados);

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
            background: "#111827", border: "1px solid #1E2A45", borderRadius: 10,
            padding: "12px 16px", fontSize: 13, color: "#5A7298", marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>🔒</span>
            Los equipos aparecen automáticamente cuando terminen todos los partidos de grupos.
          </div>
          <div style={{ fontSize: 13, color: "#5A7298", marginBottom: 6 }}>
            {finalizados} de {totalGrupos} partidos de grupos finalizados
          </div>
          <div style={{ background: "#1E2A45", borderRadius: 20, height: 6 }}>
            <div style={{
              background: "#F2C116", height: 6, borderRadius: 20,
              width: `${pct}%`, transition: "width 0.4s",
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
                const pred       = drafts[p.id] ?? predictions[p.id];
                const result     = results[p.id];
                const winnerInfo = winnerIndex[p.id];
                return (
                  <ElimCard
                    key={p.id}
                    partido={p}
                    winnerInfo={winnerInfo}
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
