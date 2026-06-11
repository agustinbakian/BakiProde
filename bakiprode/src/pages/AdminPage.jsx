import { useState, useEffect } from "react";
import { subscribeToResults, saveResult } from "../lib/db";
import { PARTIDOS_GRUPOS } from "../lib/fixture";

export const ADMIN_EMAILS = [
  "agustin@bakian.io",
  // Agregar más admins acá
];

export function isAdmin(user) {
  return user && ADMIN_EMAILS.includes(user.email);
}

function PartidoRow({ partido, result }) {
  const [localVal,     setLocalVal]     = useState(result?.local     ?? "");
  const [visitanteVal, setVisitanteVal] = useState(result?.visitante ?? "");
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);

  useEffect(() => {
    if (result) {
      setLocalVal(result.local ?? "");
      setVisitanteVal(result.visitante ?? "");
    }
  }, [result]);

  async function handleSave() {
    const l = parseInt(localVal);
    const v = parseInt(visitanteVal);
    if (isNaN(l) || isNaN(v)) return;
    setSaving(true);
    await saveResult(partido.id, l, v);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div style={{
      background: "#111827",
      border: result ? "1px solid #2E7D32" : "1px solid #1E2A45",
      borderLeft: result ? "3px solid #4CAF50" : "3px solid #1E2A45",
      borderRadius: "0 10px 10px 0",
      padding: "10px 14px",
      marginBottom: 6,
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ minWidth: 70, fontSize: 11, color: "#5A7298" }}>
        <div>{partido.fecha}</div>
        <div style={{ color: "#F2C116", fontWeight: 700 }}>{partido.hora} · G{partido.grupo}</div>
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#E8EDF5", textAlign: "right", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {partido.local}
        </span>
        <input
          type="number" min="0" max="20"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          style={{
            width: 38, height: 38, textAlign: "center", fontSize: 16, fontWeight: 700,
            border: "1px solid #1E2A45", borderRadius: 8,
            background: "#0A0F1E", color: "#fff", outline: "none",
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
            background: "#0A0F1E", color: "#fff", outline: "none",
          }}
        />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {partido.visitante}
        </span>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          padding: "6px 14px", fontSize: 12, fontWeight: 700, borderRadius: 8,
          background: saved ? "#2E7D32" : "#F2C116",
          color: saved ? "#fff" : "#0A0F1E",
          border: "none", cursor: "pointer", flexShrink: 0,
          opacity: saving ? 0.6 : 1,
          minWidth: 70,
        }}
      >
        {saving ? "..." : saved ? "✓ Guardado" : "Guardar"}
      </button>
    </div>
  );
}

export function AdminPage() {
  const [results, setResults] = useState({});
  const [filtro,  setFiltro]  = useState("pendientes");
  const [search,  setSearch]  = useState("");

  useEffect(() => {
    return subscribeToResults(setResults);
  }, []);

  const filtered = PARTIDOS_GRUPOS.filter((p) => {
    const tieneResultado = !!results[p.id];
    if (filtro === "pendientes" && tieneResultado)  return false;
    if (filtro === "cargados"   && !tieneResultado) return false;
    if (search) {
      const q = search.toLowerCase();
      return p.local.toLowerCase().includes(q) || p.visitante.toLowerCase().includes(q);
    }
    return true;
  });

  const pendientes = PARTIDOS_GRUPOS.filter((p) => !results[p.id]).length;
  const cargados   = PARTIDOS_GRUPOS.filter((p) =>  results[p.id]).length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7298", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
          Panel de Admin
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
          {[
            { label: "Pendientes", value: pendientes, color: "#EF5350" },
            { label: "Cargados",   value: cargados,   color: "#4CAF50" },
            { label: "Total",      value: PARTIDOS_GRUPOS.length, color: "#F2C116" },
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
            placeholder="Buscar equipo..."
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

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#3D5070", fontSize: 14 }}>
          No hay partidos para mostrar.
        </div>
      )}

      {filtered.map((p) => (
        <PartidoRow key={p.id} partido={p} result={results[p.id]} />
      ))}
    </div>
  );
}
