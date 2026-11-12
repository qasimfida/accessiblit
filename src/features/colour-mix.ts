/** Restrict conversion to parsed RGB paints; unknown colour functions remain owner-controlled. */
export function mixColour(value: string, chroma: number): string {
  const match = /^rgba?\(([^)]+)\)$/.exec(value);
  if (!match) return value;
  const parts = match[1]!.split(/[\s,/]+/).filter(Boolean);
  if (parts.length < 3 || parts.length > 4) return value;
  const rgb = parts
    .slice(0, 3)
    .map((v) => parseFloat(v) * (v.endsWith('%') ? 2.55 : 1));
  const alpha =
    parts[3] === undefined
      ? 1
      : parseFloat(parts[3]) * (parts[3].endsWith('%') ? 0.01 : 1);
  if ([...rgb, alpha].some((v) => !Number.isFinite(v))) return value;
  const grey = 0.2126 * rgb[0]! + 0.7152 * rgb[1]! + 0.0722 * rgb[2]!;
  const mixed = rgb.map(
    (channel) =>
      Math.round(
        Math.max(0, Math.min(255, grey + (channel - grey) * chroma)) * 1000,
      ) / 1000,
  );
  return `rgba(${mixed.join(',')},${Math.max(0, Math.min(1, alpha))})`;
}
/** Shadows serialize RGB fragments; their offsets and geometry must remain untouched. */
export function mixShadow(value: string, chroma: number): string {
  return value.replace(/rgba?\([^)]+\)/g, (colour) =>
    mixColour(colour, chroma),
  );
}
