export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const API_KEY = process.env.APISPORTS_API_KEY;

  try {
    const response = await fetch(
      "https://v3.football.api-sports.io/fixtures?league=1&season=2026&status=FT-AET-PEN",
      {
        headers: {
          "x-apisports-key": API_KEY
        }
      }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
