import { useState, useEffect } from "react";
import { subscribeToResults, saveResult } from "../lib/db";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { PARTIDOS_GRUPOS, BRACKET_ELIM } from "../lib/fixture";

export const ADMIN_EMAILS = [
  "agustin@bakian.io",
];

export function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

const db = getFirestore();

async function saveWinner(partidoId, ganador) {
  const ref = doc(db, "results", "oficial");
  await setDoc(ref, { [partidoId]: { ganador } }, { merge: true });
}

function PartidoRow({ partido, result, esElim }) {
  const [localVal,     setLocalVal]     = useState(result?.local     ?? "");
  const [visitanteVal, setVisitanteVal] = useState(result?.visitante ?? "");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [savingWinner, setSavingWinner] = useState(false);

  useEffect(() => {
    if (result) {
      setLocalVal(result.local     ?? "");
      setVisitanteVal(result.visitante ?? "");
    }
  }, [result]);

  const equipoLocal     = esElim ? (partido.local     ?? "Local")     : partido.local;
  const equipoVisitante = esElim ? (partido.visitante ?? "Visitante") : partido.visitante;

  async function handleSave() {
    const l = parseInt(localVal);
    const v = parseInt(visitanteVal);
    if (isNaN(l) || isNaN(v)) return;
    setSaving(true);
    await saveResult(partido.id, l, v);
    // Si hay ganador claro en eliminatorias, lo guardamos automáticamente
    if (esElim && l !== v && partido.local) {
      const ganadorAuto = l > v ? partido.local : partido.visitante;
      await saveWinner(partido.id, ganadorAuto);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleWinner(equipo) {
    setSavingWinner(true);
    await saveWinner(partido.id, equipo);
    setSavingWinner(false);
  }

  const l = parseInt(localVal);
  const v = parseInt(visitanteVal);
  const hayResultado = !isNaN(l) && !isNaN(v) && result;
  const esEmpate     = hayResultado && l === v;
  const ganadorActual = result?.ganador ?? null;

  return (
    <div style={{
      background: "#111827",
      border: result ? "1px solid #2E7D32" : "1px solid #1E2A45",
      borderLeft: result ? "3px solid #4CAF50" : "3px solid #1E2A45",
      borderRadius: "0 10px 10px 0",
      padding: "10px 14px",
      marginBottom: 6,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ minWidth: 70, fontSize: 11, color: "#5A7298" }}>
          <div>{partido.fecha}</div>
          {esElim ? (
            <div style={{ color: "#F2C116", fontWeight: 700, fontSize: 10 }}>{partido.id}</div>
          ) : (
            <div style={{ color: "#F2C116", fontWeight: 700 }}>{partido.hora} · G{partido.grupo}</div>
          )}
        </div>

        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          {esElim ? (
            <span style={{ flex: 1, fontSize: 12, color: "#5A7298", fontStyle: partido.local ? "normal" : "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {partido.local ? `${partido.local} vs ${partido.visitante}` : partido.label}
            </span>
          ) : (
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#E8EDF5", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {partido.local}
            </span>
          )}

          <input
            type="number" min="0" max="20"
            value={localVal}
            onChange={(e) => setLocalVal(e.target.value)}
            style={{
              width: 38, height: 38, textAlign: "center", fontSize: 16, fontWeight: 700,
              border: "1px solid #1E2A45", borderRadius: 8,
              background: "#0A0F1E", color: "#fff", outline: "none", flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, color: "#3D5070", fontWeight: 700 }}>:</span>
          <input
            type="number" min="0" max="20"
            value={visitanteVal}
            onChange={(e) => setVisitanteVal(e.target.value)}
            style={{
              width: 38, height: 38, textAlign: "center", fontSize: 16, fontWeight: 700,
              border: "1px solid #1E2A45", borderRadius: 8,
              background: "#0A0F1E", color: "#fff", outline: "none", flexShrink: 0,
            }}
          />

          {!esElim && (
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {partido.visitante}
            </span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8,
            background: saved ? "#2E7D32" : "#F2C116",
            color: saved ? "#fff" : "#0A0F1E",
            border: "none", cursor: "pointer", flexShrink: 0,
            opacity: saving ? 0.6 : 1, minWidth: 70,
          }}
        >
          {saving ? "..." : saved ? "✓ Guardado" : "Guardar"}
        </button>
      </div>

      {/* Selector de ganador por penales — solo en eliminatorias con empate */}
      {esElim && hayResultado && esEmpate && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #1E2A45", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#5A7298", fontWeight: 600 }}>Ganador (penales):</span>
          {[equipoLocal, equipoVisitante].map((eq) => (
            <button
              key={eq}
              onClick={() => handleWinner(eq)}
              disabled={savingWinner}
              style={{
                padding: "4px 12px", fontSize: 12, fontWeight: 700, borderRadius: 20,
                background: ganadorActual === eq ? "#F2C116" : "transparent",
                color: ganadorActual === eq ? "#0A0F1E" : "#5A7298",
                border: `1px solid ${ganadorActual === eq ? "#F2C116" : "#1E2A45"}`,
                cursor: "pointer",
              }}
            >
              {ganadorActual === eq ? "✓ " : ""}{eq}
            </button>
          ))}
        </div>
      )}

      {/* Ganador ya marcado en partido sin empate */}
      {esElim && result?.ganador && !esEmpate && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#4CAF50" }}>
          ✓ Ganador: <strong>{result.ganador}</strong>
        </div>
      )}
    </div>
  );
}

const PARTIDOS_ELIM = BRACKET_ELIM.flatMap((fase) =>
  fase.partidos.map((p) => ({ ...p, fase: fase.fase, ronda: fase.ronda }))
);

export function AdminPage() {
  const [results, setResults] = useState({});
  const [filtro,  setFiltro]  = useState("pendientes");
  const [search,  setSearch]  = useState("");
  const [fase,    setFase]    = useState("grupos");

  useEffect(() => {
    return subscribeToResults(setResults);
  }, []);

  const partidosBase = fase === "grupos" ? PARTIDOS_GRUPOS : PARTIDOS_ELIM;
  const esElim = fase === "elim";

  const filtered = partidosBase.filter((p) => {
    const tieneResultado = !!results[p.id];
    if (filtro === "pendientes" && tieneResultado)  return false;
    if (filtro === "cargados"   && !tieneResultado) return false;
    if (search) {
      const q = search.toLowerCase();
      if (esElim) return (p.local ?? p.label ?? "").toLowerCase().includes(q) ||
                         (p.visitante ?? "").toLowerCase().includes(q) ||
                         p.id.toLowerCase().includes(q);
      return p.local.toLowerCase().includes(q) || p.visitante.toLowerCase().includes(q);
    }
    return true;
  });

  const pendientes = partidosBase.filter((p) => !results[p.id]).length;
  const cargados   = partidosBase.filter((p) =>  results[p.id]).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7298", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
          Panel de Admin
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {[
            { id: "grupos", label: "⚽ Grupos" },
            { id: "elim",   label: "🏆 Eliminatorias" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => { setFase(id); setFiltro("pendientes"); setSearch(""); }} style={{
              padding: "6px 16px", fontSize: 13, borderRadius: 20, cursor: "pointer",
              background: fase === id ? "#F2C116" : "transparent",
              color: fase === id ? "#0A0F1E" : "#5A7298",
              border: `1px solid ${fase === id ? "#F2C116" : "#1E2A45"}`,
              fontWeight: fase === id ? 700 : 500,
            }}>{label}</button>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Pendientes", value: pendientes, color: "#EF5350" },
            { label: "Cargados",   value: cargados,   color: "#4CAF50" },
            { label: "Total",      value: partidosBase.length, color: "#F2C116" },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: "#111827", border: "1px solid #1E2A45", borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 10, color: "#5A7298", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600, marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          {[
            { id: "pendientes", label: "Pendientes" },
            { id: "cargados",   label: "Cargados" },
            { id: "todos",      label: "Todos" },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => setFiltro(id)} style={{
              padding: "4px 12px", fontSize: 12, borderRadius: 20, cursor: "pointer",
              background: filtro === id ? "#F2C116" : "transparent",
              color: filtro === id ? "#0A0F1E" : "#5A7298",
              border: `1px solid ${filtro === id ? "#F2C116" : "#1E2A45"}`,
              fontWeight: filtro === id ? 700 : 500,
            }}>{label}</button>
          ))}
          <input
            type="text"
            placeholder={esElim ? "Buscar partido..." : "Buscar equipo..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              padding: "4px 12px", fontSize: 12, borderRadius: 20,
              background: "transparent", color: "#E8EDF5",
              border: "1px solid #1E2A45", outline: "none", minWidth: 140,
            }}
          />
        </div>
      </div>

      {esElim ? (
        BRACKET_ELIM.map((faseObj) => {
          const partidosFase = faseObj.partidos.filter((p) => {
            const tieneResultado = !!results[p.id];
            if (filtro === "pendientes" && tieneResultado)  return false;
            if (filtro === "cargados"   && !tieneResultado) return false;
            if (search) {
              const q = search.toLowerCase();
              return (p.local ?? p.label ?? "").toLowerCase().includes(q) ||
                     (p.visitante ?? "").toLowerCase().includes(q) ||
                     p.id.toLowerCase().includes(q);
            }
            return true;
          });
          if (partidosFase.length === 0) return null;
          return (
            <div key={faseObj.ronda}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: "#5A7298",
                textTransform: "uppercase", letterSpacing: "1px",
                padding: "10px 0 6px", borderBottom: "1px solid #1E2A45", marginBottom: 8,
              }}>
                {faseObj.fase}
              </div>
              {partidosFase.map((p) => (
                <PartidoRow key={p.id} partido={p} result={results[p.id]} esElim={true} />
              ))}
            </div>
          );
        })
      ) : (
        <>
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", padding: "2rem", color: "#3D5070", fontSize: 14 }}>
              No hay partidos para mostrar.
            </div>
          )}
          {filtered.map((p) => (
            <PartidoRow key={p.id} partido={p} result={results[p.id]} esElim={false} />
          ))}
        </>
      )}
    </div>
  );
}
