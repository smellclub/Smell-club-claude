import { GENDERS, OLFACTORY_FAMILIES, labelOf } from "@/lib/constants";
import { hasDecants } from "@/lib/product";
import { normalizeForSearch } from "@/lib/utils";
import type { Product } from "@/types/domain";

/**
 * Buscador tolerante a errores de tipeo ("kamrah" encuentra Khamrah,
 * "clubdenuit" encuentra Club de Nuit). Corre en el servidor sobre el
 * catálogo ya cargado (~100 productos), así que no necesita servicios extra.
 */

/** Palabras que no aportan a la búsqueda ("perfume de mujer" → "mujer"). */
const STOPWORDS = new Set(["de", "del", "la", "el", "los", "las", "y", "e", "para", "con", "perfume", "perfumes", "fragancia", "for", "pour", "the", "of"]);

/** Formas en que la gente escribe lo mismo → palabra que figura en el producto. */
const SYNONYMS: Record<string, string> = {
  hombre: "masculino",
  hombres: "masculino",
  varon: "masculino",
  caballero: "masculino",
  men: "masculino",
  him: "masculino",
  mujer: "femenino",
  mujeres: "femenino",
  dama: "femenino",
  women: "femenino",
  her: "femenino",
  arabe: "arabes",
  disenador: "disenador",
  decant: "decants",
  muestra: "decants",
  muestras: "decants",
};

const tokenize = (text: string) =>
  normalizeForSearch(text)
    .replace(/[^a-z0-9ñ]+/g, " ")
    .split(" ")
    .filter(Boolean);

/** Distancia de edición (con transposiciones): "khamrha" está a 1 de "khamrah". */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const rows = a.length + 1;
  const cols = b.length + 1;
  const d: number[][] = Array.from({ length: rows }, (_, i) => [i, ...Array<number>(cols - 1).fill(0)]);
  for (let j = 1; j < cols; j++) d[0][j] = j;
  for (let i = 1; i < rows; i++) {
    let rowMin = Infinity;
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
      rowMin = Math.min(rowMin, d[i][j]);
    }
    if (rowMin > max) return max + 1;
  }
  return d[a.length][b.length];
}

/** Errores permitidos según el largo: palabras cortas tienen que ser exactas. */
const allowedEdits = (term: string) => (term.length <= 3 ? 0 : term.length <= 5 ? 1 : 2);

/** "mio" → "moi": mismas letras en otro orden (solo para palabras de 3 letras). */
const sameLetters = (a: string, b: string) => a.length === b.length && [...a].sort().join("") === [...b].sort().join("");

type SearchDoc = { words: string[]; compact: string };

function buildDoc(p: Product): SearchDoc {
  const text = [
    p.name,
    p.brand,
    p.category?.name ?? "",
    p.gender ? labelOf(GENDERS, p.gender) : "",
    p.family ? labelOf(OLFACTORY_FAMILIES, p.family) : "",
    ...p.notes.top,
    ...p.notes.heart,
    ...p.notes.base,
    hasDecants(p) ? "decants" : "",
  ].join(" ");
  const words = [...new Set(tokenize(text))];
  // Nombre y marca sin espacios: "clubdenuit", "alharamain", "qaedalfursan"
  const compact = tokenize(`${p.name} ${p.brand}`).join("");
  return { words, compact };
}

/** Qué tan bien coincide un término con el producto (0 = no coincide). */
function termScore(term: string, doc: SearchDoc): number {
  const edits = allowedEdits(term);
  let best = 0;
  for (const word of doc.words) {
    if (word === term) return 3;
    if (term.length >= 2 && word.startsWith(term)) best = Math.max(best, 2.5);
    else if (term.length >= 3 && word.includes(term)) best = Math.max(best, 2);
    else if (term.length === 3 && sameLetters(term, word)) best = Math.max(best, 1.3);
    if (edits > 0 && best < 2) {
      const d = editDistance(term, word, edits);
      if (d <= edits) best = Math.max(best, 1.6 - d * 0.3);
      // Palabra a medio escribir y con error: "khamr" ~ "kamrah"
      else if (word.length > term.length && editDistance(term, word.slice(0, term.length), edits) <= Math.max(1, edits - 1)) {
        best = Math.max(best, 1);
      }
    }
  }
  if (best === 0 && term.length >= 4 && doc.compact.includes(term)) best = 2;
  return best;
}

export type SearchResult = {
  products: Product[];
  /** true cuando no hubo coincidencia completa y se muestran los más parecidos */
  approximate: boolean;
};

export function searchProducts(products: Product[], query: string): SearchResult {
  const raw = tokenize(query);
  const terms = raw.filter((t) => !STOPWORDS.has(t)).map((t) => SYNONYMS[t] ?? t);
  // Toda la búsqueda era de palabras vacías ("perfume"): no filtra nada
  if (terms.length === 0) return { products, approximate: false };

  // Además de cada palabra, se prueba la búsqueda pegada ("club de nuit" → "clubdenuit")
  const joined = raw.join("");

  const docs = products.map(buildDoc);
  const rawScores = docs.map((doc) => terms.map((t) => termScore(t, doc)));
  // Si una palabra está bien escrita para algún perfume ("scandal"), no se
  // aceptan coincidencias aproximadas de esa palabra ("sándalo") en otros.
  const strict = terms.map((_, i) => rawScores.some((s) => s[i] >= 2));

  const scored = products.map((p, idx) => {
    const doc = docs[idx];
    const scores = rawScores[idx].map((s, i) => (strict[i] && s < 2 ? 0 : s));
    const matched = scores.filter((s) => s > 0).length;
    const joinedHit = raw.length > 1 && joined.length >= 3 && doc.compact.includes(joined);
    return {
      p,
      matched: joinedHit ? terms.length : matched,
      score: scores.reduce((a, b) => a + b, 0) + (joinedHit ? 3 : 0),
    };
  });

  const byScore = (a: { score: number }, b: { score: number }) => b.score - a.score;
  const exact = scored.filter((s) => s.matched === terms.length).sort(byScore);
  if (exact.length > 0) {
    // Si lo mejor que hay es una coincidencia con error de tipeo ("maleca" → Maleka),
    // se descartan las que se parecen bastante menos.
    const top = exact[0].score / terms.length;
    const keep = top >= 2 ? exact : exact.filter((s) => s.score / terms.length >= top - 0.2);
    return { products: keep.map((s) => s.p), approximate: false };
  }

  // Nada coincide con todo: se muestran los que coinciden con la mayoría de las palabras
  const needed = Math.max(1, Math.ceil(terms.length / 2));
  const partial = scored.filter((s) => s.matched >= needed).sort((a, b) => b.matched - a.matched || byScore(a, b));
  return { products: partial.map((s) => s.p), approximate: partial.length > 0 };
}
