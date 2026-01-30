# Soomi Progress Tracker

## Aktuelle Version: v1.0.0-alpha

**Letzte Aktualisierung:** 2025-01-30

---

## Status-Übersicht

| Bereich | Status | Fortschritt |
|---------|--------|-------------|
| Shared Package | 🟢 Fertig | 100% |
| Domain Logic | 🟢 Fertig | 100% |
| Prisma Schema | 🟢 Fertig | 100% |
| i18n (DE/EN) | 🟢 Fertig | 100% |
| API | 🟡 In Arbeit | 20% |
| Mobile App | 🔴 Nicht gestartet | 0% |
| Coach Web | 🔴 Nicht gestartet | 0% |

---

## Checklisten

### Packages

#### @soomi/shared
- [x] TypeScript Types
- [x] Enums (CoachStyle, ProgramStatus, etc.)
- [x] i18n Setup (i18next)
- [x] de-DE.json
- [x] en-US.json
- [x] i18n Validation Script
- [x] Constants (Config, Thresholds)
- [x] Utils (Formatters)

#### @soomi/domain
- [x] Test Fixtures
- [x] Eligibility Logic
- [x] Eligibility Tests (28 Tests)
- [x] Recommendations Logic
- [x] Recommendations Tests (22 Tests)
- [ ] Sleep Normalizer
- [ ] Paywall Scorer
- [ ] Coach Matcher
- [ ] Lead Router
- [ ] Payout Calculator
- [ ] Report Generator

### Database (Prisma)

- [x] User Model
- [x] MagicLink Model
- [x] CoachProfile Model
- [x] Attribution Model
- [x] LeadRequest Model
- [x] ProgramTemplate Model (Multi-Program Ready)
- [x] ProgramVariant Model
- [x] ProgramInstance Model
- [x] ProgramDay Model
- [x] DailyActionTemplate Model
- [x] CheckInQuestion Model
- [x] DailyCheckIn Model
- [x] SleepSessionNormalized Model
- [x] CoachInternalNote Model
- [x] ProgramReport Model
- [x] LedgerEntry Model
- [x] Seed Script (v1.0 + v1.1 vorbereitet)

### API (/apps/api)

#### Auth
- [ ] Magic Link Request
- [ ] Magic Link Verify
- [ ] Instagram OAuth (Coach)
- [ ] JWT Middleware

#### User
- [ ] Get Profile
- [ ] Update Profile
- [ ] Consent Tracking
- [ ] Delete Account (GDPR)

#### Sleep
- [ ] Manual Entry
- [ ] Google Fit Sync
- [ ] Get Sessions
- [ ] Get Summary

#### Program
- [ ] List Programs
- [ ] Get Program Details
- [ ] Start Program
- [ ] Get Current Day
- [ ] Submit Check-in
- [ ] Mark Action Complete
- [ ] Generate Report

#### Coach
- [ ] Get Clients
- [ ] Get Client Detail
- [ ] Set Action
- [ ] Internal Notes CRUD
- [ ] Lead Accept/Decline
- [ ] Report Comment

### Mobile App (/apps/mobile)

#### Navigation
- [ ] Root Navigator
- [ ] Auth Navigator
- [ ] Main Navigator (Tabs)

#### Screens
- [ ] Welcome Screen
- [ ] Magic Link Screen
- [ ] Home Dashboard
- [ ] Tracking Screen
- [ ] Manual Entry Screen
- [ ] Sounds Screen
- [ ] Insights Screen
- [ ] Program Screen
- [ ] Day Detail Screen
- [ ] Check-in Screen
- [ ] Report Screen

#### Components
- [ ] UI Components (Button, Card, Input)
- [ ] Sleep Summary Card
- [ ] Sleep Chart
- [ ] Streak Badge
- [ ] Sound Player
- [ ] Timer Picker

### Coach Web (/apps/coach)

- [ ] Layout & Navigation
- [ ] Dashboard Page
- [ ] Clients List
- [ ] Client Detail
- [ ] Lead Requests
- [ ] Settings

---

## Entscheidungslog

### 2025-01-30

**E01: Multi-Program Architektur von Anfang an**
- Grund: LTV erhöhen durch Programm-Tiers
- Umsetzung: ProgramTemplate + ProgramVariant Tabellen
- v1.0 nutzt nur ein Programm, v1.1 aktiviert weitere

**E02: Fastify statt Express**
- Grund: Bessere TypeScript-Integration, schneller, Plugin-System
- Alternative: Express
- Entscheidung: Fastify

**E03: Magic Link statt Password**
- Grund: Einfachere UX, kein Passwort-Management
- Coach: Instagram OAuth zusätzlich für Social Proof
- Entscheidung: Magic Link für User, Instagram für Coaches

**E04: Ledger statt Prozentspeicherung**
- Grund: Audit Trail, einfachere Auszahlungen, Compliance
- Entscheidung: Immer absolute Beträge in LedgerEntry

**E05: Flache i18n-Keys**
- Grund: Einfacher für Übersetzer, eindeutige Key-Pfade
- Entscheidung: Nested mit max 2 Ebenen (section.key)

**E06: Config Snapshot in ProgramInstance**
- Grund: Programm-Änderungen nach Kauf sollen bestehende User nicht beeinflussen
- Entscheidung: configSnapshot JSON Feld

---

## Bekannte Issues

1. **Google Fit API Limits** - Muss Rate Limiting implementieren
2. **PDF Export** - Stub für v1.0, vollständig in v1.1
3. **Offline Support** - Nicht in v1.0 Scope
4. **iOS App** - Erst nach Android Launch

---

## Nächste Schritte

1. [ ] API: Auth Routes implementieren
2. [ ] API: Sleep Routes implementieren
3. [ ] API: Program Routes implementieren
4. [ ] Mobile: Navigation Setup
5. [ ] Mobile: Auth Flow
6. [ ] Tests: Domain Coverage auf 90%+ bringen

---

## Referenzen

| Datei | Beschreibung |
|-------|-------------|
| `/prisma/schema.prisma` | Datenbank Schema |
| `/packages/shared/src/types/index.ts` | TypeScript Types |
| `/packages/shared/src/i18n/locales/` | Übersetzungen |
| `/packages/domain/src/program/` | Eligibility & Recommendations |

---

## Metriken

| Metrik | Wert |
|--------|------|
| Domain Tests | 50 |
| i18n Keys | ~150 |
| Prisma Models | 16 |
| Supported Locales | 2 (de-DE, en-US) |
