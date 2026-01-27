/**
 * LocalStorage Versioning and Migration System
 *
 * This system allows safe schema changes to localStorage data by:
 * 1. Tracking a version number in localStorage
 * 2. Running migration functions when the version is outdated
 * 3. Supporting incremental migrations (1.0 -> 1.1 -> 1.2, etc.)
 */

// Current storage version - increment this when making breaking changes
export const CURRENT_STORAGE_VERSION = '1.0';

// Storage key for version tracking
const VERSION_KEY = 'poplist_storage_version';

// Type for migration functions
type MigrationFn = () => void;

// Migration registry: version -> migration function to run to reach that version
// Migrations run in order from current version to target version
const migrations: Record<string, MigrationFn> = {
  // Example migration for version 1.1:
  // '1.1': () => {
  //   // Migrate watchlists to add new field
  //   const data = localStorage.getItem('watchlists');
  //   if (data) {
  //     const watchlists = JSON.parse(data);
  //     const migrated = watchlists.map((w: any) => ({
  //       ...w,
  //       newField: w.newField ?? 'default',
  //     }));
  //     localStorage.setItem('watchlists', JSON.stringify(migrated));
  //   }
  // },
};

/**
 * Get the currently stored version, or null if not set
 */
export function getStoredVersion(): string | null {
  try {
    return localStorage.getItem(VERSION_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the storage version
 */
export function setStoredVersion(version: string): void {
  try {
    localStorage.setItem(VERSION_KEY, version);
  } catch (error) {
    console.error('Failed to set storage version:', error);
  }
}

/**
 * Compare two version strings (e.g., '1.0' < '1.1' < '2.0')
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = a.split('.').map(Number);
  const partsB = b.split('.').map(Number);

  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const numA = partsA[i] || 0;
    const numB = partsB[i] || 0;
    if (numA < numB) return -1;
    if (numA > numB) return 1;
  }
  return 0;
}

/**
 * Get all migration versions that need to run, in order
 */
function getMigrationsToRun(fromVersion: string): string[] {
  return Object.keys(migrations)
    .filter((version) => compareVersions(version, fromVersion) > 0)
    .filter((version) => compareVersions(version, CURRENT_STORAGE_VERSION) <= 0)
    .sort(compareVersions);
}

/**
 * Run all pending migrations and update the version
 * Call this on app initialization
 */
export function runMigrations(): { migrationsRun: string[]; success: boolean } {
  const storedVersion = getStoredVersion();
  const migrationsRun: string[] = [];

  // If no version stored, this is a fresh install or pre-versioning data
  if (!storedVersion) {
    // Set to current version - no migrations needed for fresh install
    setStoredVersion(CURRENT_STORAGE_VERSION);
    return { migrationsRun: [], success: true };
  }

  // If already at current version, nothing to do
  if (storedVersion === CURRENT_STORAGE_VERSION) {
    return { migrationsRun: [], success: true };
  }

  // Get and run pending migrations
  const pendingMigrations = getMigrationsToRun(storedVersion);

  for (const version of pendingMigrations) {
    try {
      console.log(`[Storage Migration] Running migration to v${version}...`);
      migrations[version]();
      migrationsRun.push(version);
    } catch (error) {
      console.error(`[Storage Migration] Failed at v${version}:`, error);
      return { migrationsRun, success: false };
    }
  }

  // Update to current version
  setStoredVersion(CURRENT_STORAGE_VERSION);

  if (migrationsRun.length > 0) {
    console.log(`[Storage Migration] Completed migrations: ${migrationsRun.join(' -> ')}`);
  }

  return { migrationsRun, success: true };
}

/**
 * Check if a migration is needed (without running it)
 */
export function isMigrationNeeded(): boolean {
  const storedVersion = getStoredVersion();
  if (!storedVersion) return false;
  return storedVersion !== CURRENT_STORAGE_VERSION;
}

/**
 * Reset storage version (for testing/debugging)
 */
export function resetStorageVersion(): void {
  try {
    localStorage.removeItem(VERSION_KEY);
  } catch {
    // Ignore errors
  }
}
