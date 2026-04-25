# CLAUDE.md — BigBadPhotos
# Part of BigBadAgentForce (BBAF)

## Project

- **Name:** BigBadPhotos
- **Description:** Photography portfolio/gallery app with image ranking (OpenCV), password-protected access, and export/review workflow
- **Status:** deployed
- **Priority:** P3
- **Tech Stack:** Python, Flask, OpenCV, React, Vite
- **GitHub:** github.com/bigbadmn-sys/bigbadphotos.git
- **Deployed URL:** deployed (Railway — see Procfile/nixpacks.toml)

## BBAF Integration

This project is managed by BigBadAgentForce.
- **Primary agent:** Cursor (code implementation)
- **Review agent:** Claude (code review, architecture)
- **Research agent:** Gemini (when needed)
- **Workspace:** ~/BigBadAgentForce/

## Git Rules

- Branch naming: `bbaf/bigbadphotos-[description]`
- Never push to main
- Conventional commits: feat:, fix:, docs:, refactor:, test:
- PRs require Robert's approval before merge

## Structure

- `app.py` — Flask entry point, serves API + React static build
- `backend/` — Python modules (ranking, image processing)
- `frontend/` — React/Vite SPA
  - `src/hooks/useExporter.js` — Export logic
  - `src/views/ReviewExportView.jsx` — Review + export UI
- `requirements.txt` — Python deps
- `Procfile` / `nixpacks.toml` / `railpack.toml` — Railway deployment

## Key APIs

- `POST /analyze` — image ranking
- `POST /rank` — ranking endpoint
- `BBP_PASSWORD` env var — enables password auth

## Environment Variables

- `BBP_PASSWORD` — optional password gate

## Current Priorities

1. Commit in-progress changes (5 modified files, ~711 insertions)
2. `useExporter.js` + `ReviewExportView.jsx` overhaul — verify export flow
3. Dependency updates in `frontend/package.json`

## Known Issues

- Auth is basic password via HTTP Basic Auth — no sessions

## Restrictions

- No deployment without Robert's explicit approval
- Keep .env and secrets out of commits
- Do not modify Railway config (Procfile/nixpacks.toml) without review
