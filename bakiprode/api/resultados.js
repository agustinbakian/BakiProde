export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const API_KEY = process.env.WORLDCUP_API_KEY;

  try {
    // Primero intentamos livescores, si no hay partidos en vivo traemos histórico
    const [liveRes, histRes] = await Promise.all([
      fetch(`https://worldcupapi.com/api/livescores?key=${API_KEY}`),
      fetch(`https://worldcupapi.com/api/history?key=${API_KEY}&date_from=2026-06-11&date_to=2026-07-19`)
    ]);

    const liveData = await liveRes.json();
    const histData = await histRes.json();

    res.status(200).json({ live: liveData, history: histData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
