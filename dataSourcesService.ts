import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { DataSourceItem } from '../types';
import { sanitizeForFirestore } from './firestoreUtil';

const COLLECTION = 'dataSources';

/**
 * All risk incidents in this app live nested inside a DataSourceItem's
 * `incidents` array (whether that source came from a manual report, a file
 * upload, or a Google Sheet sync) — the fused-metrics/dashboard engine
 * already assumes this shape. Rather than restructure that engine, each
 * DataSourceItem is persisted as its own Firestore document (id = doc id),
 * so incidents ride along with it. This matches the DataSource entity in
 * firebase-blueprint.json (with the incidents array as an extra field,
 * which Firestore and firestore.rules both allow).
 */
export async function loadAllSources(): Promise<DataSourceItem[]> {
  const snap = await getDocs(collection(db, COLLECTION));
  return snap.docs.map((d) => d.data() as DataSourceItem);
}

/**
 * Call from a useEffect keyed on the `sources` state. Writes every current
 * source and deletes any source id that was present last time but isn't
 * anymore (moved to trash / permanently deleted / etc). Returns the id list
 * to keep as `previousIds` for the next call.
 */
export async function syncSources(
  current: DataSourceItem[],
  previousIds: string[]
): Promise<string[]> {
  const currentIds = current.map((s) => s.id);
  const removedIds = previousIds.filter((id) => !currentIds.includes(id));

  if (current.length === 0 && removedIds.length === 0) {
    return currentIds;
  }

  const batch = writeBatch(db);
  current.forEach((source) => {
    batch.set(doc(db, COLLECTION, source.id), sanitizeForFirestore(source));
  });
  removedIds.forEach((id) => {
    batch.delete(doc(db, COLLECTION, id));
  });
  await batch.commit();
  return currentIds;
}
