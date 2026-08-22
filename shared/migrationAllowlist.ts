import { brandCatalog } from "./brandRegistry";

/**
 * Singura listă de repository-uri care poate fi migrată în acest proiect.
 * Varianta completă `dic-ionarul-rela-iilor` este sursa pentru ruta /oferte/relatii;
 * repository-ul `dictionarulrelatiilor` rămâne arhivă tehnică, nu ofertă distinctă.
 */
/** Repository-uri aprobate ca surse secundare ale unei rute unice. */
export const supplementaryApprovedRepositories = ["weight-los-manifest"] as const;

export const approvedSourceRepositories = [...brandCatalog.map((brand) => brand.sourceRepo), ...supplementaryApprovedRepositories] as readonly string[];

export const explicitlyExcludedRepositories = [
  "tevreauinapoi",
  "groworpay",
  "grow-or-pay",
  "parinte-de-succes",
  "dictionarulrelatiilor",
] as const;

export function isApprovedMigrationRepository(repository: string) {
  return approvedSourceRepositories.includes(repository) && !explicitlyExcludedRepositories.includes(repository as (typeof explicitlyExcludedRepositories)[number]);
}
