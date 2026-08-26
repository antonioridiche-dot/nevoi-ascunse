import { approvedSourceRepositories, explicitlyExcludedRepositories } from "./migrationPolicy";

/**
 * Singura listă de repository-uri care poate fi migrată în acest proiect.
 * Varianta completă `dic-ionarul-rela-iilor` este sursa pentru ruta /relatii;
 * repository-ul `dictionarulrelatiilor` rămâne arhivă tehnică, nu ofertă distinctă.
 */
export { approvedSourceRepositories, explicitlyExcludedRepositories };

export function isApprovedMigrationRepository(repository: string) {
  return (approvedSourceRepositories as readonly string[]).includes(repository) && !explicitlyExcludedRepositories.includes(repository as (typeof explicitlyExcludedRepositories)[number]);
}
