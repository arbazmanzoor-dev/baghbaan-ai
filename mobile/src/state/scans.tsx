import AsyncStorage from '@react-native-async-storage/async-storage';
import { Directory, File, Paths } from 'expo-file-system';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';

import type { ClassId } from '@/content/diseases';

export type ScanRecord = {
  id: string;
  createdAt: string; // ISO timestamp
  imageUri: string; // square photo in the app's document directory
  heatmapUri: string | null; // Grad-CAM overlay (online scans only)
  topClass: ClassId;
  confidence: number;
  lowConfidence: boolean;
  probabilities: Record<ClassId, number>;
  source: 'online' | 'offline';
  /** Why an offline scan ran on the phone: the user's setting, or no server connection. */
  offlineReason?: 'setting' | 'unreachable';
  modelVersion: string;
};

type NewScan = Omit<ScanRecord, 'id' | 'createdAt' | 'imageUri' | 'heatmapUri'> & {
  imageUri: string; // temporary file to persist
  heatmapBase64: string | null;
};

type OnlineUpgrade = Pick<
  ScanRecord,
  'topClass' | 'confidence' | 'lowConfidence' | 'probabilities' | 'modelVersion'
> & { heatmapBase64: string | null };

type ScansContext = {
  scans: ScanRecord[]; // newest first
  hydrated: boolean;
  addScan: (scan: NewScan) => Promise<ScanRecord>;
  /** Replace an on-device result with the server's (adds the heatmap). */
  upgradeScan: (id: string, online: OnlineUpgrade) => Promise<void>;
  removeScan: (id: string) => void;
  clearScans: () => void;
};

const STORAGE_KEY = 'baghbaan.scans.v1';
const MAX_SCANS = 200;
const scansDir = () => new Directory(Paths.document, 'scans');

const Context = createContext<ScansContext | null>(null);

function deleteFiles(scan: ScanRecord) {
  for (const uri of [scan.imageUri, scan.heatmapUri]) {
    if (!uri) continue;
    const file = new File(uri);
    if (file.exists) file.delete();
  }
}

/** Scan history: metadata in AsyncStorage, images in the document directory. */
export function ScansProvider({ children }: PropsWithChildren) {
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => raw && setScans(JSON.parse(raw) as ScanRecord[]))
      .catch(() => undefined)
      .finally(() => setHydrated(true));
  }, []);

  const persist = useCallback((next: ScanRecord[]) => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
    return next;
  }, []);

  const addScan = useCallback(
    async ({ imageUri, heatmapBase64, ...rest }: NewScan) => {
      const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
      const dir = scansDir();
      dir.create({ intermediates: true, idempotent: true });

      const image = new File(dir, `${id}.jpg`);
      new File(imageUri).copy(image);
      let heatmapUri: string | null = null;
      if (heatmapBase64) {
        const heatmap = new File(dir, `${id}_heatmap.png`);
        heatmap.create({ overwrite: true });
        await heatmap.write(heatmapBase64, { encoding: 'base64' });
        heatmapUri = heatmap.uri;
      }

      const record: ScanRecord = {
        ...rest,
        id,
        createdAt: new Date().toISOString(),
        imageUri: image.uri,
        heatmapUri,
      };
      setScans((prev) => {
        const next = [record, ...prev];
        next.slice(MAX_SCANS).forEach(deleteFiles);
        return persist(next.slice(0, MAX_SCANS));
      });
      return record;
    },
    [persist],
  );

  const upgradeScan = useCallback(
    async (id: string, { heatmapBase64, ...result }: OnlineUpgrade) => {
      let heatmapUri: string | null = null;
      if (heatmapBase64) {
        const heatmap = new File(scansDir(), `${id}_heatmap.png`);
        heatmap.create({ overwrite: true });
        await heatmap.write(heatmapBase64, { encoding: 'base64' });
        heatmapUri = heatmap.uri;
      }
      setScans((prev) =>
        persist(
          prev.map((s) =>
            s.id === id ? { ...s, ...result, heatmapUri, source: 'online', offlineReason: undefined } : s,
          ),
        ),
      );
    },
    [persist],
  );

  const removeScan = useCallback(
    (id: string) =>
      setScans((prev) => {
        prev.filter((s) => s.id === id).forEach(deleteFiles);
        return persist(prev.filter((s) => s.id !== id));
      }),
    [persist],
  );

  const clearScans = useCallback(
    () =>
      setScans((prev) => {
        prev.forEach(deleteFiles);
        return persist([]);
      }),
    [persist],
  );

  const value = useMemo(
    () => ({ scans, hydrated, addScan, upgradeScan, removeScan, clearScans }),
    [scans, hydrated, addScan, upgradeScan, removeScan, clearScans],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useScans(): ScansContext {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useScans must be used inside ScansProvider');
  return ctx;
}
