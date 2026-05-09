import { useState, useEffect } from "react";
import {
  subscribeToUsers,
  subscribeToAllPredictions,
  subscribeToResults,
  calcUserStats,
} from "../lib/db";

function getInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const MEDAL = ["#FAEEDA", "#D3D1C7", "#F5C4B3"];
const MEDAL_TEXT = ["#633806", "#2C2C2A", "#4A1B0C"];

export function RankingPage({ user }) {
  const [users,       setUsers]       = useState({});
  const [allPreds,    setAllPreds]    = useState({});
  const [results,     setResults]     = useState({});

  useEffect(() => {
    const u1 = subscribeToUsers(setUsers);
    const u2 = subscribeToAllPredictions(setAllPreds);
    const u3 = subscribeToResults(setResults);
    return () => { u1(); u2(); u3(); };
  }, []);

  const ranked = Object.entries(users)
    .map(([uid, profile]) => {
      const preds = allPreds[uid] ?? {};
      const stats = calcUserStats(preds, results);
      return { uid, ...profile, ...stats };
    })
    .sort((a, b) => b.pts - a.pts || b.exact - a.exact || b.winner - a.winner);

  return (
    <div>
      <div style={{ fontSize: 16, fontWeight: 600, color: "#111", marginBottom: 16 }}>
        Tabla de posiciones
      </div>

      {ranked.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#aaa", fontSize: 14 }}>
          Todavía no hay participantes.
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr>
            <th style={{ width: 32, padding: "6px 8px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}></th>
            <th style={{ padding: "6px 8px", textAlign: "left", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}>Participante</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}>Exactos</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}>Ganador</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}>Pronóst.</th>
            <th style={{ padding: "6px 8px", textAlign: "right", fontSize: 12, fontWeight: 600, color: "#aaa", borderBottom: "0.5px solid #eee" }}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map(({ uid, displayName, photoURL, pts, exact, winner, predCount }, i) => {
            const isMe = uid === user.uid;
            const bg   = i < 3 ? MEDAL[i] : (i % 2 === 0 ? "#fff" : "#fafaf8");
            const tc   = i < 3 ? MEDAL_TEXT[i] : "#666";
            return (
              <tr key={uid} style={{ background: isMe ? "#E1F5EE" : bg }}>
                <td style={{ padding: "10px 8px", borderBottom: "0.5px solid #eee" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: i < 3 ? MEDAL[i] : "#f0f0ed",
                    color: i < 3 ? MEDAL_TEXT[i] : "#888",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700,
                  }}>
                    {i + 1}
                  </div>
                </td>
                <td style={{ padding: "10px 8px", borderBottom: "0.5px solid #eee" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {photoURL ? (
                      <img src={photoURL} alt="" width={28} height={28} style={{ borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "#E1F5EE", color: "#085041",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 700,
                      }}>
                        {getInitials(displayName)}
                      </div>
                    )}
                    <span style={{ fontWeight: isMe ? 700 : 500, color: "#111", fontSize: 14 }}>
                      {displayName}{isMe && <span style={{ color: "#0F6E56", fontSize: 11, marginLeft: 4 }}>(vos)</span>}
                    </span>
                  </div>
                </td>
                <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "0.5px solid #eee", color: "#111" }}>{exact}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "0.5px solid #eee", color: "#111" }}>{winner}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "0.5px solid #eee", color: "#666" }}>{predCount}</td>
                <td style={{ padding: "10px 8px", textAlign: "right", borderBottom: "0.5px solid #eee", fontWeight: 700, fontSize: 15, color: "#111" }}>{pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
