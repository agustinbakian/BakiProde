import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#f5f5f0",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: 20,
        padding: "48px 40px",
        maxWidth: 400,
        width: "100%",
        boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
        textAlign: "center",
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "#0F6E56", display: "flex",
          alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px",
        }}>
          <span style={{ color: "#9FE1CB", fontWeight: 700, fontSize: 22 }}>B</span>
        </div>

        <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", marginBottom: 8 }}>
          BakiProde
        </h1>
        <p style={{ fontSize: 15, color: "#666", marginBottom: 8 }}>
          Mundial 2026
        </p>
        <p style={{ fontSize: 13, color: "#999", marginBottom: 36 }}>
          Usá tu cuenta de Google de Bakián para entrar.
        </p>

        <button
          onClick={login}
          style={{
            width: "100%",
            padding: "12px 24px",
            background: "#0F6E56",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#FFF" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Entrar con Google
        </button>
      </div>
    </div>
  );
}
