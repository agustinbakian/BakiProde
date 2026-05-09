import { FLAG_ISO } from "../lib/fixture";

export function Flag({ country }) {
  const code = FLAG_ISO[country];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      srcSet={`https://flagcdn.com/48x36/${code}.png 2x`}
      width={24}
      height={18}
      alt={country}
      style={{ borderRadius: 2, objectFit: "cover", border: "0.5px solid rgba(0,0,0,0.1)", flexShrink: 0 }}
    />
  );
}
