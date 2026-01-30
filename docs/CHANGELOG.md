# Soomi Changelog

Alle wichtigen Änderungen werden hier dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [Unreleased]

### Geplant für v1.1.0
- **Programme**
  - Sleep Kickstart (7 Tage, Self-Guided, 49€)
  - Deep Reset (28 Tage, Premium, 349€)
  - Repeat Reset (10 Tage, Rückkehrer, 149€)
- **Features**
  - Chat-Integration (In-App Messaging Coach ↔ Client)
  - Video-Calls (1:1 Sessions)
  - PDF Export für Reports
- **Plattformen**
  - iOS App
  - Apple Health Integration
- **Coach**
  - Team Mode (Coach mit Assistenten)
  - Co-Branding

### Geplant für v1.2.0
- Webcam Activity Tracking (Bildschirmzeit)
- Coach-spezifische Programme
- Affiliate System
- Subscription Model

---

## [1.0.0] - TBD

### Added

#### Mobile App (Android)
- Magic Link Auth
- Home Dashboard mit Sleep Summary
- Manuelles Sleep Tracking
- Google Fit Integration
- 3 Ocean Sounds mit Timer (15/30/45/60 min)
- 7-Tage Insights Chart
- 14-Tage Programm mit Daily Actions
- Täglicher Check-in (~30 Sekunden)
- End-of-Program Report Ansicht

#### Coach Dashboard (Web)
- Instagram OAuth Onboarding
- Coach Profil (Sprachen, Stil, Tags, Kapazität)
- Client Liste mit Traffic Light Status (🟢🟡🔴)
- Lead Request Queue mit 48h Timer
- Tägliche Aktion-Zuweisung
- Interne Notizen (nur Coach sieht)
- Report-Kommentar (Client sieht)
- Verdienst-Übersicht

#### Backend
- Fastify API mit TypeScript
- PostgreSQL + Prisma ORM
- Magic Link Auth System
- Sleep Data Normalization
- Paywall Scoring Engine
- Coach Matching Algorithmus (Sprache, Stil, Kapazität, Fairness)
- Lead Routing mit Auto-Timeout (48h)
- Payout Ledger System (80/20 oder 50/50 Split)

#### Packages
- @soomi/shared: Types, Schemas, i18n, Utils
- @soomi/domain: Pure Business Logic
  - Program Eligibility (28 Unit Tests)
  - Program Recommendations (22 Unit Tests)

#### Infrastruktur
- Monorepo mit pnpm Workspaces
- Turbo für Build Orchestration
- i18n mit DE/EN Support
- Vitest für Unit Tests

### Security
- GDPR Consent Tracking
- User Data Deletion (Right to Erasure)
- Coach kann nur eigene Clients sehen
- Interne Notizen nicht für Clients sichtbar
- 90-Tage Attribution Window

---

## Versioning Policy

- **MAJOR (x.0.0)**: Breaking Changes, große neue Features
- **MINOR (0.x.0)**: Neue Features, abwärtskompatibel
- **PATCH (0.0.x)**: Bugfixes, kleine Verbesserungen

---

## Migration Notes

### v1.0.0 → v1.1.0
- Neue ProgramTemplates werden per Seed hinzugefügt
- Bestehende ProgramInstances bleiben unverändert (configSnapshot)
- Chat-Tabellen werden hinzugefügt (neue Migration)
