export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/2000/matches?season=2026",
      { headers: { "X-Auth-Token": API_KEY } }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Error fetching data" });
  }
}
