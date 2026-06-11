export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const API_KEY = process.env.WORLDCUP_API_KEY;

  try {
    const response = await fetch(
      "https://worldcupapi.com/api/matches",
      { headers: { "Authorization": `Bearer ${API_KEY}` } }
    );
    const data = await response.json();
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: "Error fetching data" });
  }
}
