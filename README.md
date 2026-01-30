# Soomi

Coach-powered Sleep Optimization Platform.

## 🚀 Quick Start

### Voraussetzungen

- Node.js 20+
- pnpm 8+
- PostgreSQL 15+
- Docker (optional)

### Installation

```bash
# Repository klonen
git clone https://github.com/soomi/soomi.git
cd soomi

# Dependencies installieren
pnpm install

# Umgebungsvariablen
cp .env.example .env
# -> .env anpassen

# Datenbank setup
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Development starten
pnpm dev
```

## 📁 Projektstruktur

```
soomi/
├── apps/
│   ├── mobile/         # React Native + Expo (Android)
│   ├── coach/          # Next.js Coach Dashboard
│   └── api/            # Fastify Backend
├── packages/
│   ├── shared/         # Types, Schemas, i18n
│   └── domain/         # Pure Business Logic
├── prisma/             # Database Schema
└── docs/               # Dokumentation
```

## 🛠️ Scripts

```bash
# Development
pnpm dev              # Alle Apps starten
pnpm dev:mobile       # Nur Mobile
pnpm dev:coach        # Nur Coach Web
pnpm dev:api          # Nur API

# Database
pnpm db:generate      # Prisma Client generieren
pnpm db:migrate       # Migrationen ausführen
pnpm db:seed          # Seed Data
pnpm db:studio        # Prisma Studio

# Testing
pnpm test             # Alle Tests
pnpm test:domain      # Domain Logic Tests
pnpm test:api         # API Integration Tests
pnpm test:coverage    # Coverage Report

# Build
pnpm build            # Alle Apps bauen
pnpm build:mobile     # Android APK

# i18n
pnpm i18n:validate    # Prüft alle Locale Files

# Linting
pnpm lint             # ESLint
pnpm format           # Prettier
```

## 🏗️ Architektur

### Tech Stack

| Bereich | Technologie |
|---------|-------------|
| Mobile | React Native + Expo |
| Coach Web | Next.js 14 |
| API | Fastify + TypeScript |
| Database | PostgreSQL + Prisma |
| Auth | Magic Link + Instagram OAuth |
| i18n | i18next + react-i18next |

### Packages

- **@soomi/shared**: Geteilte Types, Zod Schemas, i18n, Utils
- **@soomi/domain**: Pure Business Logic mit 100% Unit Test Coverage

## 🌍 i18n

Neue Sprachen hinzufügen:

1. Kopiere `/packages/shared/src/i18n/locales/en-US.json`
2. Erstelle z.B. `fr-FR.json`
3. Übersetze alle Keys
4. Füge Locale in `/packages/shared/src/i18n/i18n.ts` hinzu
5. `pnpm i18n:validate` ausführen

## 📚 Dokumentation

- [Progress Tracker](./docs/PROGRESS.md)
- [Changelog](./docs/CHANGELOG.md)
- [API Dokumentation](./docs/API.md)
- [Architektur](./docs/ARCHITECTURE.md)
- [Coding Standards](./docs/CODING_STANDARDS.md)

## 🚢 Release Process

1. Feature Branch → `main` via PR
2. Tests müssen grün sein
3. `pnpm version patch|minor|major`
4. Git Tag wird automatisch erstellt
5. GitHub Action baut und deployed

### Versioning

- **MAJOR (x.0.0)**: Breaking Changes, große neue Features
- **MINOR (0.x.0)**: Neue Features, abwärtskompatibel
- **PATCH (0.0.x)**: Bugfixes, kleine Verbesserungen

## 📄 Lizenz

Proprietary - All Rights Reserved

---

## v1.0 Features

- ✅ Magic Link Auth
- ✅ 14-Day Sleep Reset Program
- ✅ Manual Sleep Tracking
- ✅ Google Fit Integration
- ✅ 3 Ocean Sounds + Timer
- ✅ Daily Check-ins
- ✅ Coach Dashboard
- ✅ Lead Routing (48h Timer)
- ✅ Outcome Reports
- ✅ i18n (DE/EN)

## v1.1 Roadmap

- 🔜 Chat Integration
- 🔜 Video Calls
- 🔜 Multiple Programs (Kickstart, Deep Reset, Repeat)
- 🔜 iOS App
- 🔜 PDF Export
