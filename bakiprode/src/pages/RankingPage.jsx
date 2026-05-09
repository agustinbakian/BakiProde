import { useState, useEffect } from "react";
import {
  subscribeToUsers, subscribeToAllPredictions,
  subscribeToResults, calcUserStats,
} from "../lib/db";

function getInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const MEDAL_BG   = ["#F2C116", "#3D5070", "#8B4513"];
const MEDAL_TEXT = ["#0A0F1E", "#E8EDF5", "#E8EDF5"];

export function RankingPage({ user }) {
  const [users,    setUsers]    = useState({});
  const [allPreds, setAllPreds] = useState({});
  const [results,  setResults]  = useState({});

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
      <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7298", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 16 }}>
        Tabla de posiciones
      </div>

      {ranked.length === 0 && (
        <div style={{ textAlign: "center", padding: "2rem", color: "#3D5070", fontSize: 14 }}>
          Todavía no hay participantes.
        </div>
      )}

      {ranked.map(({ uid, displayName, photoURL, pts, exact, winner, predCount }, i) => {
        const isMe = uid === user.uid;
        const medalBg   = i < 3 ? MEDAL_BG[i]   : "#1E2A45";
        const medalText = i < 3 ? MEDAL_TEXT[i]  : "#5A7298";

        return (
          <div key={uid} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 14px",
            background: isMe ? "#1A1500" : "#111827",
            border: isMe ? "1px solid #F2C116" : "1px solid #1E2A45",
            borderRadius: 12, marginBottom: 6,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%",
              background: medalBg, color: medalText,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 13, fontWeight: 700, flexShrink: 0,
            }}>
              {i + 1}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
              {photoURL ? (
                <img src={photoURL} alt="" width={28} height={28}
                  style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "#1E2A45", color: "#5A7298",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, flexShrink: 0,
                }}>
                  {getInitials(displayName)}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: isMe ? 800 : 600, color: "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {displayName}{isMe && <span style={{ color: "#F2C116", fontSize: 11, marginLeft: 4 }}>(vos)</span>}
                </div>
                <div style={{ fontSize: 11, color: "#3D5070" }}>
                  {exact} exactos · {winner} ganador · {predCount} pronóst.
                </div>
              </div>
            </div>

            <div style={{ fontSize: 22, fontWeight: 800, color: "#F2C116", flexShrink: 0 }}>
              {pts}
            </div>
          </div>
        );
      })}
    </div>
  );
}
