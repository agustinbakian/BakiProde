import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useResultsSync } from "./hooks/useResultsSync";
import { subscribeToPredictions, subscribeToResults, calcUserStats } from "./lib/db";
import { PARTIDOS_GRUPOS } from "./lib/fixture";
import { LoginPage } from "./pages/LoginPage";
import { FixturePage } from "./pages/FixturePage";
import { EliminatoriasPage } from "./pages/EliminatoriasPage";
import { RankingPage } from "./pages/RankingPage";

const TABS = [
  { id: "fixture",       label: "Fixture" },
  { id: "eliminatoria",  label: "Eliminatorias" },
  { id: "ranking",       label: "Ranking" },
];

function StatsBar({ user }) {
  const [predictions, setPredictions] = useState({});
  const [results,     setResults]     = useState({});

  useEffect(() => {
    const u1 = subscribeToPredictions(user.uid, setPredictions);
    const u2 = subscribeToResults(setResults);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const { pts, exact, winner, predCount } = calcUserStats(predictions, results);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
      {[
        { label: "Mis puntos",    value: pts,       sub: `${exact} exactos · ${winner} ganador` },
        { label: "Pronósticos",   value: predCount, sub: `de ${PARTIDOS_GRUPOS.length} partidos` },
        { label: "Actualización", value: "En vivo",  sub: "resultados automáticos" },
      ].map(({ label, value, sub }) => (
        <div key={label} style={{ background: "#f5f5f0", borderRadius: 10, padding: 12 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#111" }}>{value}</div>
          <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("fixture");

  useResultsSync();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f0" }}>
        <div style={{ fontSize: 14, color: "#aaa" }}>Cargando…</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div style={{ background: "#f5f5f0", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px 16px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: "#0F6E56",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ color: "#9FE1CB", fontWeight: 700, fontSize: 16 }}>B</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#111" }}>BakiProde</div>
              <div style={{ fontSize: 12, color: "#888" }}>Hola, {user.displayName?.split(" ")[0]}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {user.photoURL && (
              <img src={user.photoURL} alt="" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover" }} />
            )}
            <button
              onClick={logout}
              style={{
                padding: "6px 14px", fontSize: 13, fontWeight: 500,
                background: "#E1F5EE", color: "#0F6E56",
                border: "0.5px solid #5DCAA5", borderRadius: 8, cursor: "pointer",
              }}
            >
              Salir
            </button>
          </div>
        </div>

        {/* Stats */}
        <StatsBar user={user} />

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid #ddd", marginBottom: 20 }}>
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: "8px 16px", fontSize: 14, cursor: "pointer",
                borderBottom: tab === id ? "2px solid #0F6E56" : "2px solid transparent",
                color: tab === id ? "#0F6E56" : "#888",
                fontWeight: tab === id ? 600 : 400,
                background: "none", border: "none", borderBottom: tab === id ? "2px solid #0F6E56" : "2px solid transparent",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "fixture"      && <FixturePage       user={user} />}
        {tab === "eliminatoria" && <EliminatoriasPage user={user} />}
        {tab === "ranking"      && <RankingPage        user={user} />}
      </div>
    </div>
  );
}
