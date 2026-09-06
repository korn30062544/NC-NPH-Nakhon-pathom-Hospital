# Real-data fixes applied

This patch removes the main sources of fabricated metrics from the upload path.

- Single-file upload now reads actual CSV/XLSX/XLS/JSON bytes in the browser.
- Excel parsing reads every worksheet, not only SheetNames[0].
- Missing specimen/rejection totals stay 0 instead of being estimated.
- JSON import no longer invents totals from row counts.
- Fused metrics no longer estimate specimens from incident count.
- 5-year fused metrics no longer synthesize historical trends.
- Newly uploaded files are inserted into both `files` and the shared `sources` state, so all views using fused data see the same source immediately.
- Bulk file upload uses the real parser instead of `simulateAISplitAndRoute()` and random values.
- Google Sheet bulk links are parsed from their real CSV export; Google Forms are not treated as a data source unless their response Sheet is connected.
- The UI's AI Split demo no longer injects simulated incidents.
- PDF ingestion fails explicitly rather than hallucinating/guessing extracted values.
- Risk-level parsing bug fixed: ordinary words containing `e`/`f` are no longer classified Critical.

## Still required before hospital production

The app still needs a real server-side database/authentication layer for persistence across browser reloads/users/devices. React state is shared across pages during the current session, but it is not a hospital-grade database. Do not persist identifiable patient data in localStorage. Configure the Gemini server endpoint and secrets on the deployment platform separately.
