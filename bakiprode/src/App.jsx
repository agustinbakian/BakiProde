import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { useResultsSync } from "./hooks/useResultsSync";
import { subscribeToPredictions, subscribeToResults, calcUserStats } from "./lib/db";
import { PARTIDOS_GRUPOS, BRACKET_ELIM } from "./lib/fixture";
import { LoginPage } from "./pages/LoginPage";
import { FixturePage } from "./pages/FixturePage";
import { EliminatoriasPage } from "./pages/EliminatoriasPage";
import { RankingPage } from "./pages/RankingPage";
import { AdminPage, isAdmin } from "./pages/AdminPage";
import { SidebarRanking } from "./components/SidebarRanking";

const TOTAL_PARTIDOS = PARTIDOS_GRUPOS.length + BRACKET_ELIM.flatMap(f => f.partidos).length;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isMobile;
}

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
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(2,1fr)",
      gap: 8, padding: "12px 16px",
      background: "#0D1424", borderBottom: "1px solid #1E2A45"
    }}>
      {[
        { label: "Mis puntos",  value: pts,       sub: `${exact} exactos · ${winner} ganador`, gold: true },
        { label: "Pronósticos", value: predCount, sub: `de ${TOTAL_PARTIDOS} partidos`, gold: false },
      ].map(({ label, value, sub, gold }) => (
        <div key={label} style={{ background: "#111827", borderRadius: 8, padding: "10px 12px", border: "1px solid #1E2A45" }}>
          <div style={{ fontSize: 10, color: "#5A7298", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: gold ? "#F2C116" : "#fff" }}>{value}</div>
          <div style={{ fontSize: 10, color: "#3D5070", marginTop: 1 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

function StatsBarDesktop({ user }) {
  const [predictions, setPredictions] = useState({});
  const [results,     setResults]     = useState({});

  useEffect(() => {
    const u1 = subscribeToPredictions(user.uid, setPredictions);
    const u2 = subscribeToResults(setResults);
    return () => { u1(); u2(); };
  }, [user.uid]);

  const { pts, exact, winner, predCount } = calcUserStats(predictions, results);

  return (
    <div style={{
      display: "grid", gridTemplateColumns: "repeat(3,1fr)",
      gap: 8, padding: "14px 24px",
      background: "#0D1424", borderBottom: "1px solid #1E2A45"
    }}>
      {[
        { label: "Mis puntos",  value: pts,       sub: `${exact} exactos · ${winner} ganador`, gold: true },
        { label: "Pronósticos", value: predCount, sub: `de ${TOTAL_PARTIDOS} partidos`, gold: false },
        { label: "Mi posición", value: "—",        sub: "ranking en vivo", gold: true },
      ].map(({ label, value, sub, gold }) => (
        <div key={label} style={{ background: "#111827", borderRadius: 8, padding: "10px 12px", border: "1px solid #1E2A45" }}>
          <div style={{ fontSize: 10, color: "#5A7298", textTransform: "uppercase", letterSpacing: ".5px", fontWeight: 600, marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: gold ? "#F2C116" : "#fff" }}>{value}</div>
          <div style={{ fontSize: 10, color: "#3D5070", marginTop: 1 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const { user, loading, logout } = useAuth();
  const [tab, setTab] = useState("fixture");
  const isMobile = useIsMobile();

  useResultsSync();

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0A0F1E" }}>
        <div style={{ fontSize: 14, color: "#5A7298" }}>Cargando…</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  const admin = isAdmin(user);

  const TABS = [
    { id: "fixture",      label: "Fixture" },
    { id: "eliminatoria", label: "Eliminatorias" },
    { id: "ranking",      label: "Ranking" },
    ...(admin ? [{ id: "admin", label: "⚙️ Admin" }] : []),
  ];

  const padding = isMobile ? "12px 16px" : "12px 24px";

  return (
    <div style={{ background: "#0A0F1E", minHeight: "100vh", fontFamily: "'DM Sans', sans-serif", color: "#E8EDF5" }}>

      {/* Topbar */}
      <div style={{ background: "#060C18", borderBottom: "1px solid #1E2A45", padding, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/logo.png" alt="Bakián" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
          <div>
            <div style={{ fontSize: isMobile ? 15 : 17, fontWeight: 800, color: "#fff" }}>BakiProde</div>
            <div style={{ fontSize: 11, color: "#5A7298", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px" }}>Mundial 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {user.photoURL && (
            <img src={user.photoURL} alt="" width={30} height={30}
              style={{ borderRadius: "50%", objectFit: "cover", border: "2px solid #F2C116" }} />
          )}
          {!isMobile && <span style={{ fontSize: 13, color: "#E8EDF5", fontWeight: 600 }}>{user.displayName?.split(" ")[0]}</span>}
          <button onClick={logout} style={{
            padding: "5px 12px", fontSize: 12, fontWeight: 700,
            background: "transparent", color: "#F2C116",
            border: "1px solid #F2C116", borderRadius: 7, cursor: "pointer",
          }}>Salir</button>
        </div>
      </div>

      {/* Stats */}
      {isMobile ? <StatsBar user={user} /> : <StatsBarDesktop user={user} />}

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 0,
        padding: isMobile ? "0 16px" : "0 24px",
        borderBottom: "1px solid #1E2A45", background: "#0D1424",
        overflowX: "auto",
      }}>
        {TABS.map(({ id, label }) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: isMobile ? "10px 14px" : "10px 16px",
            fontSize: 15, cursor: "pointer",
            color: tab === id ? "#F2C116" : "#5A7298",
            fontWeight: tab === id ? 700 : 500,
            background: "none", border: "none",
            borderBottom: tab === id ? "2px solid #F2C116" : "2px solid transparent",
            whiteSpace: "nowrap",
          }}>
            {label}
          </button>
        ))}
      </div>

      {/* Body */}
      {isMobile ? (
        <div style={{ padding: "16px" }}>
          {tab === "fixture"      && <FixturePage       user={user} />}
          {tab === "eliminatoria" && <EliminatoriasPage user={user} />}
          {tab === "ranking"      && <RankingPage        user={user} />}
          {tab === "admin"        && <AdminPage />}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: tab === "admin" ? "1fr" : "1fr 280px", maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ padding: "16px 20px", borderRight: tab === "admin" ? "none" : "1px solid #1E2A45", minWidth: 0 }}>
            {tab === "fixture"      && <FixturePage       user={user} />}
            {tab === "eliminatoria" && <EliminatoriasPage user={user} />}
            {tab === "ranking"      && <RankingPage        user={user} />}
            {tab === "admin"        && <AdminPage />}
          </div>
          {tab !== "admin" && (
            <div style={{ padding: 16 }}>
              <SidebarRanking user={user} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
