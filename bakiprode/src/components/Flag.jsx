import { FLAG_ISO } from "../lib/fixture";

export function Flag({ country, size = 24 }) {
  const code = FLAG_ISO[country];
  if (!code) return null;
  const h = Math.round(size * 0.75);
  return (
    <img
      src={`https://flagcdn.com/${size}x${h}/${code}.png`}
      srcSet={`https://flagcdn.com/${size * 2}x${h * 2}/${code}.png 2x`}
      width={size}
      height={h}
      alt={country}
      style={{ borderRadius: 2, objectFit: "cover", border: "0.5px solid rgba(0,0,0,0.1)", flexShrink: 0 }}
    />
  );
}
