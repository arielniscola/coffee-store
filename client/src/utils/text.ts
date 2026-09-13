// Minúsculas y sin tildes, para que "jose" encuentre a "José".
export const normalizeText = (value?: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export const matchesName = (name: string | undefined, query: string) => {
  const q = normalizeText(query);
  return !q || normalizeText(name).includes(q);
};
