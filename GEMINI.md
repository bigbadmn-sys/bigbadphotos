# GEMINI.md — BigBadPhotos
# Part of BigBadAgentForce (BBAF)

## Project

- **Name:** BigBadPhotos
- **Description:** Photography portfolio/gallery with image ranking and export review workflow
- **Status:** deployed (active maintenance)
- **GitHub:** github.com/bigbadmn-sys/bigbadphotos

## Your Role (Gemini)

- Research: image ranking algorithms, UX patterns for photo review apps
- Documentation: user guides, API docs
- Analysis: review export flow, suggest UX improvements
- Integration: this app is the human-review step in BigBadPhotoAutomation's pipeline

## Pipeline Integration

BigBadPhotos is the review UI for BigBadPhotoAutomation:
1. BigBadPhotoAutomation creates a review folder of JPEGs
2. User opens folder in BigBadPhotos, marks keep/maybe/reject
3. BigBadPhotos exports `bigbad_decisions.json` (schema v1)
4. BigBadPhotoAutomation imports decisions and continues pipeline

## Key Files

- `app.py` — Flask entry point
- `frontend/src/hooks/useExporter.js` — export logic + decisions JSON
- `frontend/src/views/ReviewExportView.jsx` — review + export UI
- `bigbadphotos_ux_3/` — UX v3 design handoff files (reference for future work)

## Tech Stack

Python, Flask, OpenCV, React, Vite

## Decisions JSON Schema (v1)

```json
{
  "schema": "bigbadphotos.decisions.v1",
  "exported_at": "<ISO timestamp>",
  "include_maybes": false,
  "keeps": ["IMG_001.jpg"],
  "maybes": [],
  "rejects": ["IMG_002.jpg"],
  "decisions": {"IMG_001.jpg": "keep", "IMG_002.jpg": "reject"}
}
```

## Git Rules

- Branch naming: `bbaf/bigbadphotos-[description]`
- Never push to main
- Conventional commits
- PRs require Robert's approval
