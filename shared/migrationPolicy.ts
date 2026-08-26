/**
 * Politica independentă a surselor aprobate pentru migrare.
 * Registrul public nu este folosit ca sursă de adevăr aici, pentru ca o ofertă
 * nouă să nu poată intra în catalog înainte de a fi aprobată explicit.
 */
export const approvedSourceRepositories = [
  "pestedespartire",
  "numerology",
  "soulmate-sketch",
  "linia-palmelor",
  "cafeea",
  "visul-meu",
  "survival",
  "directia-abundentei",
  "armonii-bine",
  "iubire",
  "liniste-audio",
  "calendarul-norocului",
  "dic-ionarul-rela-iilor",
  "secretul-zodiei",
  "tarot",
  "romanian-weightloss-funnel",
  "weight-los-manifest",
  "vraji-spells-store",
  "prieteni-cu-beneficii",
] as const;

export const explicitlyExcludedRepositories = [
  "tevreauinapoi",
  "groworpay",
  "grow-or-pay",
  "parinte-de-succes",
  "dictionarulrelatiilor",
] as const;
