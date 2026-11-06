# Design reference (Google Stitch export)

Visual reference only — **nothing in this folder is shipped**. Every screen is rebuilt natively
in `mobile/`. The design system spec lives in [`baghbaan_ai/DESIGN.md`](baghbaan_ai/DESIGN.md);
its tokens are centralised in `mobile/src/theme/`.

Deliberate deviations from the export:

- Pesticide names, dosages and helpline numbers shown in the mock-ups are placeholders and are
  **not** reproduced. The app always defers to the local agriculture officer / SKUAST-Kashmir.
- Marketing statistics (sample counts, accuracy claims, certifications) are replaced by real
  figures served from the backend `/metrics` endpoint.
- Out-of-scope features (weather banner, advisory feed, user profile, voice readout, data
  export) are omitted.
