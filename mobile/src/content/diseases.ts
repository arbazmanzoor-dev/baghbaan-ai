/**
 * Disease information bundled from shared/diseases.json — the same file the backend serves —
 * so advice is available offline and always shown in the current UI language.
 */
import data from '@shared/diseases.json';

import type { Language } from '@/i18n/languages';
import type { StatusTone } from '@/theme/tokens';

export const CLASS_IDS = ['apple_scab', 'black_rot', 'cedar_apple_rust', 'healthy'] as const;
export type ClassId = (typeof CLASS_IDS)[number];

export type DiseaseText = {
  name: string;
  summary: string;
  description: string;
  symptoms: string[];
  prevention: string[];
  management: string[];
};

export type Disease = {
  id: ClassId;
  scientificName: string;
  severity: 'high' | 'moderate' | 'none';
  text: DiseaseText;
};

type RawDisease = (typeof data.diseases)[number];

export function getDisease(id: ClassId, lang: Language): Disease {
  const raw = data.diseases.find((d) => d.id === id) as RawDisease;
  return {
    id,
    scientificName: raw.scientific_name,
    severity: raw.severity as Disease['severity'],
    text: raw.content[lang],
  };
}

export const allDiseases = (lang: Language) => CLASS_IDS.map((id) => getDisease(id, lang));

export const diseaseName = (id: ClassId, lang: Language) => getDisease(id, lang).text.name;

export const expertNote = (lang: Language) => data.messages.expert_note[lang];

export const lowConfidenceMessage = (lang: Language) => data.messages.low_confidence[lang];

export const toneFor = (id: ClassId, lowConfidence: boolean): StatusTone =>
  lowConfidence ? 'warning' : id === 'healthy' ? 'healthy' : 'disease';

/** Library colour tone for a disease's severity. */
export const severityTone = (severity: Disease['severity']): StatusTone =>
  severity === 'high' ? 'disease' : severity === 'moderate' ? 'warning' : 'healthy';

/** True if the query matches the disease name in any language or its scientific name. */
export function matchesQuery(id: ClassId, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const raw = data.diseases.find((d) => d.id === id) as RawDisease;
  const names = Object.values(raw.content).map((c) => c.name);
  return [...names, raw.scientific_name].some((n) => n.toLowerCase().includes(q));
}
