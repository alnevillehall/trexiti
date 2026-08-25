const jamaicaDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Jamaica",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export function getJamaicaBusinessDate(date = new Date()) {
  const parts = jamaicaDateFormatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

