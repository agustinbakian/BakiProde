# BakiProde — Mundial 2026

Prode interno de Bakián para el Mundial 2026. React + Firebase + football-data.org.

---

## Setup en 5 pasos

### 1. Cloná / descomprimí el proyecto

```bash
cd bakiprode
npm install
```

### 2. Creá el proyecto en Firebase

1. Entrá a https://console.firebase.google.com
2. "Crear proyecto" → nombre: `bakiprode`
3. Activá **Authentication** → método: Google
4. Activá **Firestore Database** → modo producción
5. Activá **Hosting**

### 3. Pegá tus credenciales en `src/lib/config.js`

Reemplazá los valores de `FIREBASE_CONFIG` con los de tu proyecto Firebase
(los encontrás en Configuración del proyecto → Tus apps → SDK de configuración).

También pegá tu API key de https://www.football-data.org en `FOOTBALL_DATA_API_KEY`.

### 4. Instalá Firebase CLI y logueate

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # seleccioná tu proyecto bakiprode
```

### 5. Deploy

```bash
npm run deploy
```

La app queda en `https://bakiprode.web.app` (o el dominio que elijas).

---

## Desarrollo local

```bash
npm run dev
```

---

## Estructura del proyecto

```
src/
  lib/
    config.js      ← credenciales y constantes (EDITÁ ESTE)
    firebase.js    ← inicialización Firebase
    fixture.js     ← fixture completo Mundial 2026
    db.js          ← capa de datos Firestore
  hooks/
    useAuth.js         ← Google Auth
    useResultsSync.js  ← sincronización automática de resultados
  components/
    Flag.jsx       ← bandera por país (flagcdn.com)
  pages/
    LoginPage.jsx
    FixturePage.jsx
    EliminatoriasPage.jsx
    RankingPage.jsx
  App.jsx
  main.jsx
firestore.rules    ← reglas de seguridad Firestore
firebase.json      ← config hosting
```

---

## Sistema de puntos

| Resultado | Puntos |
|-----------|--------|
| Exacto (ej: 2-1 vs 2-1) | 3 pts |
| Ganador correcto (ej: pronosticás 2-1, sale 3-0) | 1 pt |
| Incorrecto | 0 pts |

---

## Actualización de resultados

Los resultados se sincronizan automáticamente desde **football-data.org** cada 5 minutos
mientras algún usuario tiene la app abierta.

El ID de competencia del Mundial 2026 está en `config.js` como `WC_COMPETITION_ID`.
Confirmar el ID correcto cuando football-data.org lo publique (actualmente usa 2000 para el WC).

---

## Notas de seguridad

- Los resultados oficiales solo los puede escribir el backend (Firestore Rules).
  Para actualizarlos manualmente durante el torneo podés hacerlo desde la consola de Firebase.
- PII de usuarios (nombre, mail, foto) viene de Google Auth y solo se usa para mostrar en el ranking.
- No se almacena ninguna credencial en el código — todo va en `config.js` que no se commitea.

Agregá `src/lib/config.js` a tu `.gitignore` antes de pushear a un repo compartido.
