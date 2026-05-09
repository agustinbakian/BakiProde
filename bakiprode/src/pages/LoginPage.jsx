import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { login } = useAuth();

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center",
      justifyContent: "center", background: "#0A0F1E", padding: "1rem",
    }}>
      <div style={{
        background: "#111827", borderRadius: 20, padding: "48px 40px",
        maxWidth: 400, width: "100%",
        border: "1px solid #1E2A45", textAlign: "center",
      }}>
        <img src="/logo.png" alt="Bakián" style={{ width: 64, height: 64, borderRadius: 12, objectFit: "cover", margin: "0 auto 20px" }} />

        <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6 }}>
          BakiProde
        </h1>
        <p style={{ fontSize: 15, color: "#F2C116", fontWeight: 700, marginBottom: 6 }}>
          Mundial 2026
        </p>
        <p style={{ fontSize: 13, color: "#5A7298", marginBottom: 36 }}>
          Ingresá con tu cuenta de Google de Bakián para participar.
        </p>

        <button
          onClick={login}
          style={{
            width: "100%", padding: "14px 24px",
            background: "#F2C116", color: "#0A0F1E",
            border: "none", borderRadius: 12,
            fontSize: 15, fontWeight: 800, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#0A0F1E" d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z"/>
          </svg>
          Entrar con Google
        </button>
      </div>
    </div>
  );
}
