import { useState, useEffect } from "react";
import {
  subscribeToUsers, subscribeToAllPredictions,
  subscribeToResults, calcUserStats, subscribeToPredictions,
} from "../lib/db";

function getInitials(name) {
  return (name || "?").split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const MEDAL_BG   = ["#F2C116", "#3D5070", "#8B4513"];
const MEDAL_TEXT = ["#0A0F1E", "#E8EDF5", "#E8EDF5"];

export function SidebarRanking({ user }) {
  const [users,       setUsers]       = useState({});
  const [allPreds,    setAllPreds]    = useState({});
  const [results,     setResults]     = useState({});
  const [myPreds,     setMyPreds]     = useState({});

  useEffect(() => {
    const u1 = subscribeToUsers(setUsers);
    const u2 = subscribeToAllPredictions(setAllPreds);
    const u3 = subscribeToResults(setResults);
    const u4 = subscribeToPredictions(user.uid, setMyPreds);
    return () => { u1(); u2(); u3(); u4(); };
  }, [user.uid]);

  const ranked = Object.entries(users)
    .map(([uid, profile]) => ({
      uid, ...profile, ...calcUserStats(allPreds[uid] ?? {}, results)
    }))
    .sort((a, b) => b.pts - a.pts || b.exact - a.exact || b.winner - a.winner);

  const myStats = calcUserStats(myPreds, results);
  const myPos   = ranked.findIndex((u) => u.uid === user.uid) + 1;

  return (
    <div>
      {/* Ranking */}
      <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7298", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
        Ranking
      </div>

      {ranked.map(({ uid, displayName, photoURL, pts }, i) => {
        const isMe    = uid === user.uid;
        const medalBg   = i < 3 ? MEDAL_BG[i]   : "#1E2A45";
        const medalText = i < 3 ? MEDAL_TEXT[i]  : "#5A7298";
        return (
          <div key={uid} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "9px 10px",
            background: isMe ? "#1A1500" : "#111827",
            border: isMe ? "1px solid #F2C116" : "1px solid #1E2A45",
            borderRadius: 9, marginBottom: 5,
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: "50%",
              background: medalBg, color: medalText,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12, fontWeight: 700, flexShrink: 0,
            }}>{i + 1}</div>
            {photoURL ? (
              <img src={photoURL} alt="" width={26} height={26}
                style={{ borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: isMe ? "2px solid #F2C116" : "none" }} />
            ) : (
              <div style={{
                width: 26, height: 26, borderRadius: "50%", background: "#1E2A45",
                color: "#5A7298", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, flexShrink: 0,
              }}>{getInitials(displayName)}</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: isMe ? 800 : 600, color: isMe ? "#F2C116" : "#E8EDF5", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {displayName}{isMe && <span style={{ color: "#5A7298", fontSize: 10, marginLeft: 4 }}>(vos)</span>}
              </div>
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#F2C116", flexShrink: 0 }}>{pts}</div>
          </div>
        );
      })}

      {/* Mis stats */}
      <div style={{ borderTop: "1px solid #1E2A45", marginTop: 14, paddingTop: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#5A7298", textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
          Mis stats
        </div>
        {[
          { label: "Exactos",         value: myStats.exact,    color: "#F2C116" },
          { label: "Ganador correcto", value: myStats.winner,   color: "#4CAF50" },
          { label: "Fallados",         value: myStats.wrong,    color: "#EF5350" },
          { label: "Sin pronosticar",  value: myStats.predCount != null ? (72 - myStats.predCount) : "—", color: "#E8EDF5" },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "5px 0", borderBottom: "1px solid #1E2A45" }}>
            <span style={{ fontSize: 13, color: "#5A7298" }}>{label}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
