# YourTrust — Complete Feature & Architecture Documentation

> **Version**: 0.1.0 | **Framework**: Next.js 16 (App Router) | **Database**: MongoDB | **Auth**: Firebase | **AI**: NEAR AI Cloud + Google Gemini

---

## Table of Contents

1. [Project Philosophy](#1-project-philosophy)
2. [System Architecture](#2-system-architecture)
3. [Feature Deep-Dives](#3-feature-deep-dives)
   - 3.1 [User Authentication & Onboarding](#31-user-authentication--onboarding)
   - 3.2 [Lending Agreements — Full Lifecycle](#32-lending-agreements--full-lifecycle)
   - 3.3 [AI Trust Score Analysis](#33-ai-trust-score-analysis)
   - 3.4 [AI Installment Plan Generation](#34-ai-installment-plan-generation)
   - 3.5 [AI Negotiation Chat](#35-ai-negotiation-chat)
   - 3.6 [AI Voice Calling (VAPI + Make.com)](#36-ai-voice-calling-vapi--makecom)
   - 3.7 [Group Lending (Many-to-One)](#37-group-lending-many-to-one)
   - 3.8 [Witness Verification System](#38-witness-verification-system)
   - 3.9 [Buffer Days & Trust Score Mechanics](#39-buffer-days--trust-score-mechanics)
   - 3.10 [Payment Proof Management](#310-payment-proof-management)
   - 3.11 [Real-Time Location Tracking](#311-real-time-location-tracking)
   - 3.12 [Notification System](#312-notification-system)
   - 3.13 [PAN Identity Verification](#313-pan-identity-verification)
   - 3.14 [Email Notification Engine](#314-email-notification-engine)
   - 3.15 [Recent Friends Feature](#315-recent-friends-feature)
   - 3.16 [Dashboard & Landing Pages](#316-dashboard--landing-pages)
4. [Data Models](#4-data-models)
5. [API Route Reference](#5-api-route-reference)
6. [AI Integration Details](#6-ai-integration-details)
7. [Complete Data Flows](#7-complete-data-flows)
8. [Security & Privacy](#8-security--privacy)
9. [Environment Configuration](#9-environment-configuration)

---

## 1. Project Philosophy

YourTrust transforms **informal lending** between friends and family into a secure, trackable experience. The core premise: money between people you know doesn't need lawyers or courts — it needs **transparency, trust scores, and AI mediation**.

### Problem Space
- **Awkwardness**: Money conversations strain relationships
- **Forgetfulness**: No structured tracking for informal loans
- **No Documentation**: Handshake deals have no accountability
- **Privacy Concerns**: Financial negotiations are sensitive
- **No Credit History**: Informal lending doesn't build credit

### Solution Pillars
1. **Digital Agreements** with lifecycle tracking
2. **AI-Powered Trust Analysis** using credit history
3. **Privacy-Preserving AI** via NEAR AI Cloud TEE
4. **Flexible Repayment** with AI-generated installment plans
5. **Community/Group lending** for pooled contributions
6. **Non-intrusive Collection** via smart location-aware AI calls

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │ Landing  │  │  Auth    │  │Dashboard │  │ Agreement Detail │   │
│  │  Page    │  │SignIn/Up │  │  Home    │  │  Negotiate/Proof │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
│           │              │            │              │               │
│           ▼              ▼            ▼              ▼               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              Next.js App Router (Server + Client)            │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │    │
│  │  │  Server      │  │  Client      │  │  Server Actions  │   │    │
│  │  │  API Routes  │  │  Components  │  │  (Installment     │   │    │
│  │  │  ~40 Routes  │  │  ~60 UI +    │  │   Plans, Analysis)│   │    │
│  │  │              │  │  Dashboard   │  │                  │   │    │
│  │  └──────┬───────┘  └──────────────┘  └──────────────────┘   │    │
│  └─────────┼───────────────────────────────────────────────────┘    │
└────────────┼────────────────────────────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES LAYER                           │
│                                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐    │
│  │ MongoDB  │  │  Firebase    │  │ NEAR AI  │  │ Google Gemini  │    │
│  │  Atlas   │  │  Auth + FCM  │  │  Cloud   │  │  2.5 Flash     │  │
│  ├──────────┤  ├──────────────┤  ├──────────┤  ├────────────────┤  │
│  │ Mongoose │  │ Admin SDK    │  │OpenAI API│  │ GenAI SDK      │  │
│  │   ODM    │  │ Messaging    │  │  Qwen/   │  │ Schema Output  │  │
│  │          │  │              │  │  Claude  │  │                │  │
│  ├──────────┤  ├──────────────┤  ├──────────┤  ├────────────────┤  │
│  │ Users    │  │ Auth State   │  │ Trust    │  │ 3 installment  │  │
│  │Agreements│  │ Push Notifs  │  │ Analysis │  │ plans w/ dates │  │
│  │ Groups   │  │              │  │ Strategy │  │ validation     │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
│                                                                    │
│  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌────────────────┐  │
│  │ Radar.io │  │  Nodemailer  │  │ VAPI AI  │  │   Make.com     │  │
│  │Location  │  │  Gmail SMTP  │  │ Voice AI │  │   Webhooks     │  │
│  ├──────────┤  ├──────────────┤  ├──────────┤  ├────────────────┤  │
│  │Dynamic   │  │ HTML Email   │  │Conver-   │  │ Call workflow  │  │
│  │Geofences │  │ Templates    │  │sational  │  │ Automation     │  │
│  │ + OSM    │  │ (5 types)    │  │ AI Calls │  │                │  │
│  └──────────┘  └──────────────┘  └──────────┘  └────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

# 3. Feature Deep-Dives

---

## 3.1 User Authentication & Onboarding

### Files
- `firebase.ts` — Firebase client init (app, auth, messaging, Google provider)
- `app/auth/signin/page.tsx` — Sign-in page (email/password + Google)
- `app/auth/signup/page.tsx` — Registration page
- `app/api/auth/signup/route.ts` — Creates user in MongoDB after Firebase auth
- `app/api/auth/signin/route.ts` — Upserts user in MongoDB on sign-in

### How It Works

1. **Sign Up** (`/auth/signup`):
   - User fills name, email, phone, password
   - `createUserWithEmailAndPassword()` creates Firebase Auth account
   - On success, `POST /api/auth/signup` creates a MongoDB `User` document with `trustScore: 70`
   - User is redirected to `/dashboard`

2. **Sign In** (`/auth/signin`):
   - Email/password or Google Sign-In (popup)
   - `POST /api/auth/signin` upserts the user (creates if new, returns existing)
   - Google Sign-In auto-creates MongoDB user on first time

3. **Session Management**:
   - `onAuthStateChanged` listener in every dashboard page
   - Unauthorized users are redirected to `/auth/signin`
   - Firebase manages JWT tokens automatically

### User Schema Defaults
```
trustScore: 70
totalLent: 0
totalBorrowed: 0
agreementCount: 0
isVerified: false
```

---

## 3.2 Lending Agreements — Full Lifecycle

### Files
- `models/Agreement.ts` — Complete agreement schema (100+ fields)
- `app/api/agreements/route.ts` — GET (list by user) + POST (create, both money & asset)
- `app/api/agreements/[id]/route.ts` — GET (detail) + PATCH (update) + DELETE
- `app/dashboard/create/page.tsx` — Choice page (Money Lending / Asset Lending)
- `app/dashboard/create/money-lending/page.tsx` — 4-step money lending wizard
- `app/dashboard/create/asset-lending/page.tsx` — 4-step asset lending wizard
- `app/dashboard/agreement/[id]/page.tsx` — Full detail view (with Pay & Close / Upload & Close)

### Agreement Lifecycle States

```
CREATION → pending_witness (if witness added)
         → active (no witness)
                ↓
           reviewing (borrower uploads proof)
                ↓
           settled OR overdue
```

### Agreement Creation — Choice Page (`/dashboard/create`)
The `/create` page now serves as a **launchpad** with two options:
- **Money Lending** — Standard cash loan with borrower details, buffer days, witness, and proof
- **Asset Lending** — Physical asset loan with asset details, deposit, and instructions

### Money Lending Wizard (`/dashboard/create/money-lending`)
Original 4-step wizard for cash loans:

| Step | Fields | Validation |
|------|--------|------------|
| **1. Loan Details** | Borrower name, email, phone, amount, return date, purpose | Name, email, amount, date required |
| **2. Buffer Days** | Slider 0–14 days (private to lender) | Always valid |
| **3. Add Witness** | Witness name, email, phone (optional) | Always valid |
| **4. Upload Proof** | Transaction screenshot + auto-extracted transaction ID | File optional |

**Key behaviors**:
- Borrower must exist in MongoDB (validated at creation)
- Witness must exist in MongoDB if provided
- AI trust analysis runs **at creation time** using `analyzeTrustScoreWithHistory()`
- Emails sent to borrower + witness (if applicable)
- Notifications created for both parties
- Push notification (FCM) sent to borrower
- Both lender and borrower stats increment (`totalLent`, `totalBorrowed`, `agreementCount`)

### Asset Lending Wizard (`/dashboard/create/asset-lending`)
New 4-step wizard for lending physical assets:

| Step | Fields | Validation |
|------|--------|------------|
| **1. Asset Details** | Borrower name, email, phone, asset name | Name, email required |
| **2. Asset Condition** | Category (electronics/vehicle/furniture/etc.), condition (new/like-new/good/fair/poor), estimated value, asset photos (multi-upload) | Category, condition, value required |
| **3. Deposit & Instructions** | Security deposit amount, usage instructions | Always valid |
| **4. Upload Proof** | Transaction screenshot + auto-extracted transaction ID (deposit proof) | File optional |

**Key differences from Money Lending**:
- Tracks physical asset details (name, category, condition, photos)
- No witness step (not applicable for asset lending)
- Security deposit mechanism for asset protection
- Separate `dealType: 'asset'` in DB
- Return process involves Upload & Close (borrower returns asset + uploads proof)

### Agreement Detail View (`/dashboard/agreement/[id]`)

**Sections**:
1. **Header**: Borrower name, amount, purpose
2. **Status & Due Date**: Visual cards with days remaining/overdue
3. **Witness Status**: Shows witness name + approval state
4. **Trust Score**: Circular SVG gauge (0-100) with color coding + Strict/Lenient toggle
5. **AI Analysis**: NEAR AI trust analysis display (if available)
6. **Timeline**: Vertical timeline of events (created, witness approved, etc.)
7. **Payment Actions**:
   - AI Negotiation Assistant button → `/negotiate`
   - Send Payment Reminder (lender only)
   - Installment Plan Generator
8. **Proof Gallery**: Lender's proof + borrower's repayment proof
9. **AI Mediator Chat**: Expandable chat + extension modal
10. **Borrower Details**: Name, email, phone
11. **Action Buttons**:
    - Witness approval (witness only)
    - Pay & Close / Upload proof + mark as paid (borrower only — opens payment method dialog)
    - Upload & Close (borrower for asset lending — uploads asset return proof)
    - Settle up / Close loan (lender only — opens payment method dialog for settlement)

---

## 3.3 AI Trust Score Analysis

### Files
- `lib/near-ai.ts` — Core AI client + analysis functions
- `app/actions/generate-analysis.ts` — Server action wrapper
- `app/api/test-near-ai/route.ts` — NEAR AI connectivity test endpoint

### How It Works

**When**: Runs automatically when an agreement is created (`POST /api/agreements`)

**Data Sources**:
1. **Borrower Credit History**: Past agreements where user was borrower
   - On-time payment rate
   - Late payment count
   - Early payment count
   - Average amount
   - Witness involvement count
2. **Lender Credit History**: Past agreements where user was lender
   - Total agreements, average amount, total amount
3. **Current Trust Score**: From User document

**NEAR AI Prompt Engineering** (`analyzeTrustScoreWithHistory`):
```typescript
const prompt = `You are a senior financial risk analyst...
Analyze this lending agreement with FULL context from both parties' history.
- Amount, Borrower, Purpose, Due Date, Lender
- Borrower Credit History (on-time rate, late count, witness involvement)
- Lender Credit History

Based on comprehensive data:
1. If on-time rate < 50% → HIGH RISK
2. If new user (0 agreements) → MEDIUM RISK
3. If amount >> borrower's avg → ELEVATED RISK
4. If witness involvement → LOWER RISK
5. If lender has good track record → MORE LIKELY to honor

Respond with JSON:
{
  "trustScore": "high" | "medium" | "low",
  "riskLevel": number (0-100),
  "suggestedStrategy": "...",
  "confidence": number (0-1),
  "reasoning": ["reason 1", "reason 2"],
  "dataPoints": {
    "paymentHistory": number (0-100),
    "amountRisk": number (0-100),
    "witnessInvolvement": number (0-100),
    "trustScoreWeight": number (0-100)
  }
}`
```

**Model**: `Qwen/Qwen3-30B-A3B-Instruct-2507` via NEAR AI Cloud

**Fallback**: If NEAR AI is unavailable, `getFallbackTrustScore()` provides deterministic analysis based on:
- Purpose keywords (emergency/medical)
- Amount thresholds (>500000 KRW)
- Borrower history on-time rate

**Storage**: Results saved in agreement fields:
- `aiAnalysis`: trustScore, riskLevel, suggestedStrategy, analyzedAt
- `borrowerCreditReport`: totalAgreements, onTimeRate, lateCount, totalAmount, avgAmount
- `lenderCreditReport`: totalAgreements, avgAmount, totalAmount

---

## 3.4 AI Installment Plan Generation

### Files
- `app/actions/generate-installment-plan.ts` — Server action with Gemini
- `components/installment-plan-generator.tsx` — Dialog UI for plan selection
- `app/dashboard/agreement/[id]/upload-proofs/page.tsx` — Proof upload per installment

### How It Works

**Trigger**: Lender clicks "Generate Installment Plan with AI" on agreement detail page

**AI Models** (tried in order):
1. `gemini-2.5-flash-lite` (15 RPM, 1000 RPD — primary)
2. `gemini-2.5-flash` (10 RPM, 250 RPD — fallback)
3. `gemini-1.5-flash` (stable — last resort)

**Prompt Engineering**:
```typescript
const prompt = `Generate 3 distinct installment repayment plans for a debt.
- Amount: X KRW
- Due Date: Y
- Days Until Due: Z days

CRITICAL: ALL dates must be on or before the due date!
Plan A: Aggressive (shortest time, higher installments)
Plan B: Balanced (moderate)
Plan C: Flexible (smallest payments, max time)

Sum of amounts must equal exact total.
Start first installment within 7-14 days, space evenly.`
```

**Schema-Guided Output**: Uses Gemini's `responseMimeType: "application/json"` with a structured schema:
```json
[{
  "planName": "string",
  "description": "string",
  "durationMonths": "number",
  "totalAmount": "number",
  "installments": [{
    "date": "YYYY-MM-DD",
    "amount": "number",
    "note": "string"
  }]
}]
```

**Validation & Correction**:
1. `validateInstallmentDates()` — Checks every installment is before due date
2. `fixInstallmentDates()` — Redistributes evenly if AI exceeds due date
3. Client-side fallback: `generateSamplePlans()` — deterministic math-based plans

**User Flow**:
1. Dialog opens showing 3 plan cards with installment breakdowns
2. User selects a plan → highlighted with "SELECTED" badge
3. Confirm → plan saved to DB via `POST /api/agreements/[id]/save-plan`
4. User redirected to `/upload-proofs?plan=N`

### Example Plans for ₹10,000 / 3 months

| Plan | Duration | Installments |
|------|----------|-------------|
| **Quick Payoff** | 1 month | 2 × ₹5,000 |
| **Balanced Plan** | 2 months | 3 × ₹3,334 |
| **Flexible Plan** | 3 months | 4 × ₹2,500 |

---

## 3.5 AI Negotiation Chat

### Files
- `app/api/agreements/[id]/negotiate/route.ts` — POST (send) + GET (history)
- `app/dashboard/agreement/[id]/negotiate/page.tsx` — Full chat UI

### How It Works

**Role Detection**: The API determines if the user is `borrower`, `lender`, or `unauthorized` based on `userId` vs `agreement.borrowerId`/`lenderId`.

**Message Flow**:
1. User types message → `POST /api/agreements/[id]/negotiate`
2. Message saved to `agreement.aiMessages[]` with `[ROLE]` prefix
3. NEAR AI Cloud tries to process via `anthropic/claude-sonnet-4-5`
4. If NEAR AI fails → **smart fallback system** kicks in

### Smart Fallback Rules

| Scenario | Response |
|----------|----------|
| Borrower asks to extend, has buffer days | Extend by requested days, update `agreement.dueDate` |
| Borrower asks to extend, 0 buffer left | Cannot extend, offer installment plan |
| Borrower asks to extend without specifying days | Prompt asking how many days |
| Lender asks to extend | Deny — only borrower can extend |
| User asks about payment/installment | Guide to use Installment Plan Generator |
| User asks about history | Show on-time rate, trust score |
| General query | Show available actions menu |

### Action Results
When extension is approved:
```json
{
  "success": true,
  "action": "deadline_extended",
  "newDueDate": "2026-06-15T00:00:00.000Z",
  "daysExtended": 5,
  "remainingBufferDays": 2,
  "message": "✅ Deadline extended to June 15, 2026",
  "shouldClose": true
}
```

### UI Features
- Real-time streaming-style loading state
- Context card showing amount, due date, buffer days, installment status
- "NEAR AI • TEE" security badge
- Suggestion text: "Try: Can I extend the deadline by 5 days?"
- Timestamps on every message

---

## 3.6 AI Voice Calling (VAPI + Make.com)

### Files
- `app/api/agreements/[id]/ask-ai-call/route.ts` — Trigger AI call endpoint
- `app/utils/radar.ts` — Location context check before calling

### How It Works

**Trigger**: Lender clicks "Ask AI to Call Borrower" button

**Pre-Call Safety Check** (Radar.io location):
1. Get borrower's current GPS coordinates via browser geolocation
2. Radar.io `searchGeofences()` — check if they're in a sensitive location
3. OpenStreetMap fallback if Radar times out (3s)
4. Keyword scan for: hospital, emergency, clinic, medical, etc.
5. **If emergency detected → CALL BLOCKED** with privacy message

**Call Initiation**:
1. NEAR AI generates `mediationStrategy` (tone, intent, opening line)
2. Comprehensive context payload sent to `MAKE_CALL_WEBHOOK_URL`:
```json
{
  "agreementId": "...",
  "borrowerName": "...",
  "borrowerPhone": "...",
  "lenderName": "...",
  "amount": 50000,
  "dueDate": "...",
  "agreementContext": "...conversation rules...",
  "mediationTone": "friendly" | "neutral" | "strict",
  "mediationIntent": "reminder" | "warning" | "escalation",
  "mediationOpeningLine": "Hello {borrowerName}, this is YourTrust AI..."
}
```
3. Make.com automation forwards to VAPI AI for voice call execution

**AI Mediation Strategy** (`generateMediationStrategyWithHistory`):
- Considers borrower's payment history and trust score
- `daysOverdue <= 7`: friendly tone, reminder intent
- `daysOverdue 8-30`: neutral tone, warning intent
- `daysOverdue > 30`: strict tone, escalation intent
- Low on-time rate (<50%): automatically strict
- Model: `Qwen/Qwen3-30B-A3B-Instruct-2507`

---

## 3.7 Group Lending (Many-to-One)

### Files
- `models/Group.ts` — Group schema
- `models/MoneyRequest.ts` — Money request schema
- `app/api/groups/route.ts` — List + Create groups
- `app/api/groups/[id]/route.ts` — Get, Update (add/remove members), Delete group
- `app/api/money-requests/route.ts` — List + Create requests
- `app/api/money-requests/[id]/contribute/route.ts` — Contribute to request
- `app/dashboard/groups/page.tsx` — Group list
- `app/dashboard/groups/create/page.tsx` — Create group
- `app/dashboard/groups/[id]/page.tsx` — Group detail + member management
- `app/dashboard/groups/[id]/request/page.tsx` — Request money form
- `app/dashboard/groups/[id]/requests/[requestId]/page.tsx` — Contribute UI

### Complete Workflow

**1. Group Creation** (`/dashboard/groups/create`):
- User provides group name, description
- Optionally adds member emails (validated against MongoDB)
- Creator automatically becomes first member with "Admin" badge
- Only registered YourTrust users can be added

**2. Group Detail** (`/dashboard/groups/[id]`):
- **Admin features**: Add member dialog, remove members, delete group
- **Member features**: View members list
- **All**: See money requests with progress bars

**3. Request Money** (`/dashboard/groups/[id]/request`):
- User submits amount needed + due date + optional purpose
- Creates `MoneyRequest` document with `status: 'active'`
- Each group member can contribute any amount up to the total

**4. Contribute** (`/dashboard/groups/[id]/requests/[requestId]`):
- Another group member opens the request
- Enters contribution amount → `POST /api/money-requests/[id]/contribute`
- System creates a **separate 1-on-1 Agreement** between contributor (lender) and requester (borrower)
  - Agreement marked with `groupContribution: true` and `moneyRequestId`
  - Status set to `active` (or `pending_witness` if witness provided)
- MoneyRequest updated: `amountReceived` increases, `amountRemaining` decreases
- When `amountRemaining <= 0` → status changes to `'fulfilled'`
- Email + notification sent to requester

**Example Scenario**:
```
Alice requests ₹10,000 from "College Friends" group
  → Bob contributes ₹3,000 → Agreement #1 (Bob→Alice, ₹3,000)
  → Charlie contributes ₹4,000 → Agreement #2 (Charlie→Alice, ₹4,000)
  → David contributes ₹3,000 → Agreement #3 (David→Alice, ₹3,000)
  → Request closes (fulfilled), Alice has 3 agreements to repay individually
```

---

## 3.8 Witness Verification System

### Files
- `models/Agreement.ts` — witness fields: witnessName, witnessEmail, witnessPhone, witnessApproved
- `lib/email.ts` — witness approval email template
- `app/api/agreements/[id]/approve-witness/route.ts` — Witness approval endpoint

### How It Works

1. **At Agreement Creation**: Lender optionally adds witness name + email
   - If witness provided → agreement status = `pending_witness`, `witnessApproved = false`
   - If no witness → agreement status = `active`, `witnessApproved = true`

2. **Email Sent to Witness**: Professional HTML email with:
   - Agreement details (without monetary amount — privacy preserved)
   - "Review & Approve" button linking to agreement page
   - Witness's role: verify terms, NOT the amount

3. **Witness Approval**:
   - Witness signs in, navigates to agreement
   - Clicks "Approve as Witness" button
   - `POST /api/agreements/[id]/approve-witness` updates `witnessApproved: true`
   - Agreement status changes from `pending_witness` → `active`
   - Notification sent to lender

4. **Impact**:
   - Timeline updated with witness approval event
   - Adds credibility — AI analysis considers witness involvement as trust factor
   - Both parties notified via email

---

## 3.9 Buffer Days & Trust Score Mechanics

### Files
- `models/Agreement.ts` — bufferDays, strictMode, trustScore fields
- `app/api/agreements/[id]/extend-due-date/route.ts` — Extension endpoint
- `app/dashboard/agreement/[id]/page.tsx` — UI with gauge + toggle

### Buffer Days (Private to Lender)
- Set during agreement creation (Step 2: slider 0-14)
- **Invisible to borrower** — they only see the original due date
- Allows lender grace period before trust score is affected

### Extension Flow (Borrower Side)
1. Borrower clicks "Extend Due Date" in AI Chat area
2. Modal shows available buffer days (1 to remaining count)
3. Borrower selects number of days → `POST /api/agreements/[id]/extend-due-date`
4. System:
   - Validates user is borrower
   - Validates extension <= remaining buffer days
   - Calculates new due date
   - Reduces `agreement.bufferDays` by extension amount
   - Adds timeline event
   - Adds system message to chat

### Trust Score Algorithm
```
Initial score: 80 (agreement-level)
User-level score: 70 (default)

If payment is late:
  if strictMode:
    trustScore -= (daysOverdue × 2)  // Faster penalty
  else:
    trustScore -= daysOverdue         // Normal

Minimum: 0
Maximum: 100
```
- Penalty starts after buffer days are consumed
- Visual indicator: SVG gauge ring with color coding
  - ≥ 80: Green (text-primary)
  - 60-79: Yellow-green (chart-4)
  - 40-59: Orange (text-orange)
  - < 40: Red (destructive)

### Strict Mode Toggle (Lender Only)
- Switch on agreement detail page
- Saved via `PATCH /api/agreements/[id]`
- Affects trust score penalty rate
- "Only you can see this setting" label

---

## 3.10 Payment Proof Management

### Files
- `app/api/upload/route.ts` — Generic file upload
- `app/api/agreements/[id]/upload-installment-proof/route.ts` — Installment-specific upload
- `app/api/agreements/[id]/remove-installment-proof/route.ts` — Remove proof
- `app/api/extract-transaction-id/route.ts` — OCR transaction ID extraction
- `models/Agreement.ts` — Installment proof fields in selectedInstallmentPlan
- `app/dashboard/agreement/[id]/upload-proofs/page.tsx` — Proof upload UI grid

### Types of Proof

**1. Lender's Proof** (at creation):
- Screenshot of money sent to borrower
- Stored as `agreement.lenderProof` (fileName, fileUrl, uploadedAt)
- Displayed in Proof Gallery on detail page

**2. Borrower's Repayment Proof** (individual):
- Uploaded directly on agreement detail page
- Stored as `agreement.borrowerProof`
- Triggers status change to `reviewing`

**3. Installment Plan Proofs** (per installment):
- Uploaded on `/upload-proofs?plan=N` page
- Grid layout showing all installments with upload status
- Each installment has its own file input
- Validates: image only, max 5MB
- Stored in `agreement.selectedInstallmentPlan.installments[i]`

### File Storage
```
public/uploads/
  └── installments/
      └── {agreementId}/
          ├── installment-1-{timestamp}.jpeg
          ├── installment-2-{timestamp}.jpeg
          └── ...
```

### Transaction ID Extraction
- When lender uploads proof during creation, image is sent to `/api/extract-transaction-id`
- Python script (`scripts/extract_transaction_id.py`) uses OCR to extract transaction ID
- Auto-filled in the form field with loading spinner

---

## 3.11 Real-Time Location Tracking

### Files
- `app/utils/radar.ts` — Core location logic
- `models/LiveLocation.ts` — Location data model
- `app/api/live-location/route.ts` — Save/fetch location data

### How It Works

**Initialization**: `Radar.initialize()` with publishable key

**Geolocation Sources** (tried in order):
1. Browser `navigator.geolocation.getCurrentPosition()` — GPS coordinates
2. Radar.io `searchGeofences()` — Dynamic geofence detection (1km radius)
3. OpenStreetMap Nominatim API — Reverse geocoding fallback

**Emergency Detection**:
```typescript
const keywords = ["hospital", "emergency", "clinic", "doctor", "health", "pharmacy", "medical", "ambulance"];
```
- Checks description, name, amenity, type, category fields
- Returns `isEmergency: true/false` flag

**Mock Emergency Testing**:
- Hardcoded for email `darshiii2504@gmail.com` → returns hospital mock data

**Usage**: Pre-call safety check in `ask-ai-call` flow — blocks calls during emergencies

**Audit Trail**: Location data saved to `LiveLocation` collection with:
- agreementId, userId, role
- latitude, longitude, locationContext
- isEmergency flag, timestamp

---

## 3.12 Notification System

### Files
- `models/Notification.ts` — Notification schema
- `app/api/notifications/route.ts` — GET (list), POST (create), PATCH (mark read)
- `app/dashboard/notifications/page.tsx` — Notification UI
- `hooks/useFcmToken.ts` — FCM token management
- `lib/firebase-admin.ts` — Firebase Admin SDK messaging
- `public/firebase-messaging-sw.js` — Service worker for background push

### Types
| Type | Icon | Description |
|------|------|-------------|
| `ai_call` | Sparkles | AI voice call initiated |
| `payment_due` | Clock | Payment reminder |
| `witness_approved` | CheckCircle | Witness approved agreement |
| `money_received` | BadgeDollar | Contribution received |
| `witness_request` | Users | Witness approval requested |
| `message` | MessageSquare | General message |
| `agreement_created` | CheckCircle | New agreement created |

### Push Notifications (FCM)
1. **Token Registration**: `useFcmToken` hook
   - Requests notification permission
   - Gets FCM token from Firebase
   - Saves to user via `POST /api/user/save-token`
   - Stores in `User.fcmToken`

2. **Foreground Messages**: `onMessage()` listener → shows toast notification

3. **Background Messages**: Service worker (`firebase-messaging-sw.js`) shows system notification

4. **Admin SDK Sending**: `sendNotification()` in `lib/firebase-admin.ts`
   - Used in agreement creation to notify borrower immediately

### In-App Notifications
- Fetched from `GET /api/notifications?userId=`
- Sorted by newest first
- Unread indicator (blue dot)
- Time-ago formatting
- Color-coded by notification type

---

## 3.13 PAN Identity Verification

### Files
- `app/api/user/verify/route.ts` — Verification endpoint
- `app/dashboard/profile/page.tsx` — Verification UI in profile

### How It Works
1. User navigates to Profile → "Identity Verification" section
2. Clicks "Verify Identity" → dialog opens
3. Enters PAN number (format: 5 letters + 4 digits + 1 letter, e.g., ABCDE1234F)
4. Client-side regex validation (`/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/`)
5. `POST /api/user/verify` updates:
   - `isVerified: true`
   - `trustScore: min(existing + 10, 100)`
6. Success toast + trust score immediately updates in UI

---

## 3.14 Email Notification Engine

### Files
- `lib/email.ts` — Nodemailer transporter + 5 HTML email templates

### Email Templates

| Template | Trigger | Recipient | Key Content |
|----------|---------|-----------|-------------|
| **Agreement Request** | Agreement created | Borrower | Amount, due date, "View Agreement" button |
| **Witness Approval Request** | Agreement with witness | Witness | Terms (no monetary amount), "Review & Approve" button |
| **Witness Approved** | Witness approves | Lender | Witness name, confirmation |
| **Payment Reminder** | Lender clicks "Send Reminder" | Borrower | Days remaining, amount due, "View Agreement" button |

### Design
- Professional HTML with embedded CSS
- Responsive layout (max-width 600px)
- Gradient headers (green for general, amber for reminders)
- Clickable buttons with `NEXT_PUBLIC_APP_URL`
- Footer: "© 2026 YourTrust. Building trust, one agreement at a time."

### Sending
- Gmail SMTP (`smtp.gmail.com:587`)
- TLS with `rejectUnauthorized: false`
- Graceful failure: returns `{ success: false, error }` instead of crashing

---

## 3.15 Recent Friends Feature

### Files
- `app/api/user/recent-friends/route.ts` — API endpoint
- `components/dashboard/RecentFriendsModal.tsx` — Modal UI
- `app/dashboard/create/page.tsx` — Integration in Step 1

### How It Works
1. On agreement creation, lender clicks "Recent Friend" button
2. Modal fetches `GET /api/user/recent-friends?userId=X&email=Y`
3. API queries all agreements where user was involved
4. Deduplicates by email → returns unique list of counterparties
5. Lender can search + select → auto-fills borrower name, email, phone
6. Saves typing time for repeat lenders

---

## 3.16 Dashboard & Landing Pages

### Landing Page (`app/page.tsx`)
- Hero section with tagline: "Trust & Transparency in Informal Finance"
- Stats: 10K+ Users, ₹2M+ Managed, 99% Trust Rate
- 3 feature cards: AI Mediation, Trust Scores, Legal-Free Agreements
- How It Works: 3-step explainer
- CTA: "Get Started Free"
- Responsive navigation with Sign In / Get Started buttons

### Dashboard Home (`app/dashboard/page.tsx`)
- **Summary Card**: Total lent (green) + total borrowed (orange) + net balance
- **Create Agreement**: Prominent CTA button
- **Active Agreements**: Grouped by person (accordion) with:
  - Person initials, name, net balance
  - Each agreement: purpose, status badge, days remaining, amount
  - Color-coded: lent = green, borrowed = orange
- **Settled Section**: Muted, checkmark icons

### Dashboard Layout (`app/dashboard/layout.tsx`)
- **Desktop**: Fixed top header with nav links (Home, Create, Groups, Alerts, Profile)
- **Mobile**: Bottom navigation bar (5 tabs) + top header with logo only
- Active route highlighted with primary color
- `useFcmToken()` called once in layout
- Backdrop blur on both headers

### Profile Subpages (`/dashboard/profile/*`)
Multi-tab profile section with 5 subpages:

| Route | Tab | Key Features |
|-------|-----|-------------|
| `/dashboard/profile/account` | Account | Edit name & phone, saved to MongoDB via `PATCH /api/users/[uid]` |
| `/dashboard/profile/security` | Security | Auth method display (Google/Email), linked account info |
| `/dashboard/profile/paymentmethod` | Payment Methods | Full CRUD for UPI/Bank/Card — saved via `/api/payment-methods` |
| `/dashboard/profile/notifications` | Notifications | Push preference toggle: all / borrower only / lender only / none |
| `/dashboard/profile/help` | Help & Support | FAQ accordions + email support link |

**Payment Method CRUD flow**:
1. User adds a method (UPI ID, bank account with IFSC, card last 4 digits)
2. Each method has type, label, details (key-value pairs), and default flag
3. `GET /api/payment-methods?userId=` fetches saved methods
4. `POST /api/payment-methods` creates new method (clears other defaults if isDefault=true)
5. `DELETE /api/payment-methods/[id]` removes a method
6. Methods appear as selectable cards in settlement dialogs (Pay & Close / Settle up)

**Notification Preferences**:
- Stored on `User.notificationPreferences.push` (enum: `all`, `borrower_only`, `lender_only`, `none`)
- Saved via `PATCH /api/users/[uid]` endpoint
- Filters which push notifications the user receives

---

# 4. Data Models

## 4.1 User (`models/User.ts`)
```
uid: String (unique, indexed)
email: String (unique, lowercase)
name: String
phone: String (optional)
photoURL: String (optional)
provider: 'email' | 'google'
trustScore: Number (0-100, default: 70)
totalLent: Number (default: 0)
totalBorrowed: Number (default: 0)
agreementCount: Number (default: 0)
isVerified: Boolean (default: false)
fcmToken: String (optional)
notificationPreferences: {
  push: 'all' | 'borrower_only' | 'lender_only' | 'none' (default: 'all')
}
timestamps: true
```

## 4.2 Agreement (`models/Agreement.ts`)
```
lenderId: String (indexed)
lenderName: String
lenderEmail: String
borrowerId: String (indexed, optional)
borrowerName: String
borrowerEmail: String
borrowerPhone: String (optional)
amount: Number (min 0)
purpose: String (optional)
createdDate: Date (default: now)
dueDate: Date (required)
dealType: 'money' | 'asset' (default: 'money')
status: 'active' | 'pending_witness' | 'reviewing' | 'settled' | 'overdue'
type: 'lent' | 'borrowed'
assetName: String (optional)
assetCategory: String (optional, e.g., electronics, vehicle, furniture)
assetCondition: String (optional, e.g., new, like-new, good, fair, poor)
estimatedValue: Number (optional)
deposit: Number (optional, security deposit amount)
instructions: String (optional, usage instructions)
assetPhotos: [{ url: String, uploadedAt: Date }] (optional)
trustScore: Number (0-100, default: 80)
strictMode: Boolean (default: false)
bufferDays: Number (0-14, default: 3)
witnessName/Email/Phone: String (optional)
witnessApproved: Boolean (default: false)
lenderProof: { fileName, fileUrl, uploadedAt }
borrowerProof: { fileName, fileUrl, uploadedAt }
timeline: [{ event, date, completed }]
aiMessages: [{ role: 'user'|'ai'|'system', content, timestamp }]
selectedInstallmentPlan: {
  planIndex: Number,
  planName: String,
  installments: [{
    date: String,
    amount: Number,
    note: String,
    proofUploaded: Boolean,
    proofUrl: String,
    proofFileName: String,
    uploadedAt: Date
  }]
}
groupContribution: Boolean
moneyRequestId: String
aiAnalysis: { trustScore, riskLevel, suggestedStrategy, analyzedAt }
borrowerCreditReport: { totalAgreements, onTimeRate, lateCount, totalAmount, avgAmount }
lenderCreditReport: { totalAgreements, avgAmount, totalAmount }
mediationStrategy: { tone, messageIntent, openingLine, strategyGeneratedAt }
timestamps: true
```

## 4.3 Group (`models/Group.ts`)
```
name: String (required)
description: String (optional)
createdBy: String (UID)
createdByName: String
createdByEmail: String
members: [{
  userId: String (required),
  name: String,
  email: String,
  joinedAt: Date
}]
timestamps: true
```

## 4.4 MoneyRequest (`models/MoneyRequest.ts`)
```
groupId: String (indexed)
requesterId: String
requesterName: String
requesterEmail: String
requesterPhone: String (optional)
amount: Number (total needed)
amountReceived: Number (default: 0)
amountRemaining: Number (auto-set to amount)
purpose: String (optional)
dueDate: String (required)
status: 'active' | 'fulfilled' | 'cancelled'
contributions: [{
  lenderId, lenderName, lenderEmail,
  amount, agreementId, contributedAt
}]
timestamps: true
```

## 4.5 LiveLocation (`models/LiveLocation.ts`)
```
agreementId: String (ref to Agreement)
userId: String (optional)
role: 'borrower' | 'lender' | 'witness' | 'unknown'
latitude: Number (required)
longitude: Number (required)
locationContext: Mixed (object)
isEmergency: Boolean (default: false)
timestamp: Date (default: now)
```

## 4.6 Notification (`models/Notification.ts`)
```
userId: String (indexed)
type: 'ai_call' | 'payment_due' | 'witness_approved' | 'money_received' | 'witness_request' | 'message' | 'agreement_created'
title: String (required)
description: String (required)
read: Boolean (default: false)
agreementId: String (optional)
timestamps: true
```

## 4.7 PaymentMethod (`models/PaymentMethod.ts`)
```
userId: String (indexed)
type: 'upi' | 'bank' | 'card'
label: String (e.g., "My UPI", "SBI Account")
details: Map of String (key-value, e.g. upiId, accountNumber, ifsc, cardLast4)
isDefault: Boolean (default: false)
timestamps: true
```

---

# 5. API Route Reference

## Agreements (`/api/agreements`)
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| GET | `/api/agreements?userId=` | List all agreements for user | Firebase token |
| POST | `/api/agreements` | Create agreement (with AI analysis + emails + notifs) | Firebase token |
| GET | `/api/agreements/[id]` | Get single agreement | Firebase token |
| PATCH | `/api/agreements/[id]` | Update agreement fields (status, strictMode, etc.) | Firebase token |
| DELETE | `/api/agreements/[id]` | Delete agreement | Firebase token |
| POST | `/api/agreements/[id]/negotiate` | Send AI chat message | Firebase token |
| GET | `/api/agreements/[id]/negotiate?userId=` | Get chat history + context | Firebase token |
| POST | `/api/agreements/[id]/ask-ai-call` | Trigger AI voice call (make.com + VAPI) | Firebase token |
| POST | `/api/agreements/[id]/approve-witness` | Witness approves agreement | Firebase token |
| POST | `/api/agreements/[id]/send-reminder` | Send payment reminder email | Firebase token |
| POST | `/api/agreements/[id]/extend-due-date` | Extend due date using buffer | Borrower only |
| POST | `/api/agreements/[id]/save-plan` | Save selected installment plan | Firebase token |
| POST | `/api/agreements/[id]/upload-installment-proof` | Upload per-installment proof | Firebase token |
| POST | `/api/agreements/[id]/remove-installment-proof` | Remove proof from installment | Firebase token |

## Auth (`/api/auth`)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Create MongoDB user after Firebase signup |
| POST | `/api/auth/signin` | Upsert MongoDB user after Firebase signin |

## Users (`/api/users` and `/api/user`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/users/[uid]` | Get user by UID |
| GET | `/api/user/[uid]` | Get user by UID (alias) |
| PATCH | `/api/users/[uid]` | Update user fields |
| POST | `/api/user/verify` | PAN identity verification (+10 trust score) |
| POST | `/api/user/save-token` | Save FCM push notification token |
| GET | `/api/user/recent-friends?userId=&email=` | Get unique counterparties from past agreements |

## Groups (`/api/groups`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/groups?userId=` | List groups where user is member/creator |
| POST | `/api/groups` | Create group with members |
| GET | `/api/groups/[id]` | Get group detail |
| PATCH | `/api/groups/[id]` | Add/remove members |
| DELETE | `/api/groups/[id]` | Delete group (admin only) |

## Money Requests (`/api/money-requests`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/money-requests?groupId=` | List requests for group |
| POST | `/api/money-requests` | Create money request |
| GET | `/api/money-requests/[id]` | Get request detail |
| PATCH | `/api/money-requests/[id]` | Update request |
| POST | `/api/money-requests/[id]/contribute` | Contribute (creates 1-on-1 agreement) |

## Notifications (`/api/notifications`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/notifications?userId=` | List notifications (newest first) |
| POST | `/api/notifications` | Create notification |
| PATCH | `/api/notifications` | Mark notification as read |

## Payment Methods (`/api/payment-methods`)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/payment-methods?userId=` | List payment methods for user (sorted: default first) |
| POST | `/api/payment-methods` | Create payment method (clears other defaults if isDefault) |
| DELETE | `/api/payment-methods/[id]` | Delete payment method |

## Other Routes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/upload` | Upload file to `public/uploads/` |
| POST | `/api/extract-transaction-id` | OCR extract transaction ID from image |
| GET/POST | `/api/live-location` | Save/query location data |
| GET | `/api/test-near-ai` | NEAR AI connection test |
| POST | `/api/test-near-ai` | NEAR AI with test type (simple/trust_score) |
| GET | `/api/test-email-config` | Verify email config |
| GET | `/api/test-email` | Send test email |
| GET | `/api/test-db` | Test database connection |
| GET | `/api/test-app-url` | Test app URL configuration |

---

# 6. AI Integration Details

## 6.1 NEAR AI Cloud (`lib/near-ai.ts`)

| Property | Value |
|----------|-------|
| **Base URL** | `https://cloud-api.near.ai/v1` |
| **SDK** | OpenAI SDK (OpenAI-compatible) |
| **Trust Analysis Model** | `Qwen/Qwen3-30B-A3B-Instruct-2507` |
| **Negotiation Model** | `anthropic/claude-sonnet-4-5` |
| **Temperature** | 0.3 (low variance for financial analysis) |
| **Key Features** | TEE security, explainable AI, credit history context |

**Functions**:
- `analyzeTrustScoreWithHistory()` — Full analysis with borrower/lender history
- `analyzeTrustScore()` — Simple analysis (minimal context)
- `generateMediationStrategyWithHistory()` — Collection call strategy
- `generateMediationStrategy()` — Simple strategy
- `getUserCreditHistory()` — Calculates credit metrics from DB
- `getUserTrustScore()` — Fetches current trust score

## 6.2 Google Gemini (`app/actions/generate-installment-plan.ts`)

| Property | Value |
|----------|-------|
| **SDK** | `@google/generative-ai` |
| **Primary Model** | `gemini-2.5-flash-lite` (15 RPM free) |
| **Fallback Models** | `gemini-2.5-flash` → `gemini-1.5-flash` |
| **Output Format** | JSON with schema validation |
| **Temperature** | 0.7 |
| **Retry Logic** | Exponential backoff, model cascading |

## 6.3 VAPI AI + Make.com (`app/api/agreements/[id]/ask-ai-call/route.ts`)

- **Trigger**: POST to Make.com webhook URL from env `MAKE_CALL_WEBHOOK_URL`
- **Payload**: Full agreement context + NEAR AI-generated mediation strategy
- **Pre-call**: Radar.io location check for emergency detection

---

# 7. Complete Data Flows

## Flow 1: Agreement Creation End-to-End

```
User fills Step 1-4 in Wizard
  → Validates borrower exists in MongoDB
  → Validates witness exists (if provided)
  → POST /api/agreements
     → connectDB()
     → analyzeTrustScoreWithHistory() → NEAR AI analysis
     → Agreement.create() with timeline, aiMessages, aiAnalysis
     → User.updateOne() { $inc: totalLent, agreementCount }
     → User.updateOne() { $inc: totalBorrowed, agreementCount }
     → Notification.create() for lender + borrower
     → sendEmail() to borrower (agreementRequest template)
     → sendEmail() to witness (witnessApprovalRequest template)
     → sendNotification() FCM push to borrower
     → Return { agreement }
  → Router redirects to /dashboard
```

## Flow 2: AI Negotiation + Deadline Extension

```
Borrower opens /dashboard/agreement/[id]/negotiate
  → GET /api/agreements/[id]/negotiate → messages + agreementContext
  → User types "extend by 5 days"
  → POST /api/agreements/[id]/negotiate
     → Save user message [BORROWER] extend by 5 days
     → Try NEAR AI (claude-sonnet-4-5)
        → NEAR AI parses: extension request? enough buffer?
        → Returns JSON with action and message
     → If NEAR AI fails → fallback logic:
        → Parse message for days pattern (regex)
        → Check remaining buffer days
        → Generate appropriate response
     → If extension approved:
        → Update agreement.dueDate
        → Add timeline event
        → Add system success message
        → Calculate remaining buffer days
     → Return { aiMessage, action, actionResult }
  → UI shows AI response + success alert
  → If shouldClose → "All done!" message prompts user to return
```

## Flow 3: Group Contribution → Agreement Creation

```
Group member opens money request
  → POST /api/money-requests/[id]/contribute
     → Find MoneyRequest (validate active + sufficient remaining)
     → Agreement.create({
         lenderId: contributor,
         borrowerId: requester,
         amount: contributionAmount,
         groupContribution: true,
         moneyRequestId: requestId,
         ...
       })
     → Update MoneyRequest:
        amountReceived += contribution
        amountRemaining -= contribution
        if amountRemaining <= 0 → status = 'fulfilled'
     → Notification.create() for requester
     → sendEmail() agreement request to requester
     → sendEmail() witness approval if witness provided
     → Return { agreement, moneyRequest }
  → Router redirects to new agreement page
```

## Flow 4: AI Voice Call with Location Safety Check

```
Lender clicks "Ask AI to Call Borrower"
  → Client: navigator.geolocation.getCurrentPosition()
  → Client: Radar.searchGeofences() + OSM fallback
  → Client checks isEmergency flag
  → If emergency → BLOCK, show privacy message, EXIT
  → If safe → POST /api/agreements/[id]/ask-ai-call
     → generateMediationStrategyWithHistory() via NEAR AI
     → Build comprehensive agreement context string
     → POST to Make.com webhook with:
        agreementId, borrowerName, phone, lenderName, amount,
        dueDate, mediationTone/Intent/OpeningLine, etc.
     → Add timeline event
     → Add system message to aiMessages
     → Save mediationStrategy to agreement
     → Return { success: true }
  → UI shows success message
```

---

# 8. Security & Privacy

## NEAR AI TEE (Trusted Execution Environment)
- All AI negotiations processed in secure enclaves
- Conversations encrypted — platform operators cannot read raw data
- UI shows "TEE Secured" badges with Intel TDX and NVIDIA GPU indicators

## Firebase Authentication
- Email/password + Google OAuth 2.0
- JWT tokens managed automatically by Firebase SDK
- `onAuthStateChanged` protects all dashboard pages

## API Authorization
- Every API route checks for required `userId` parameter
- Agreement negotiation verifies user is participant (`borrowerId` or `lenderId`)
- Due date extension restricted to borrower only
- Group admin operations restricted to `createdBy`

## Privacy in Witness Flow
- Witness email explicitly states: "You will NOT see the monetary amount"
- Witness only verifies the existence of terms, not the financial details

## Emergency Location Privacy
- AI calls blocked if borrower is at sensitive location (hospital, clinic)
- Location data audited in `LiveLocation` collection

## Input Validation
- Mongoose schema validation on all models
- Server-side validation on all API endpoints
- File type/size validation on uploads (image only, max 5MB)
- PAN number regex validation (client + server)

---

# 9. Environment Configuration

```
# === MongoDB ===
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<db>?retryWrites=true&w=majority

# === Firebase Client (must start with NEXT_PUBLIC_) ===
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=

# === Firebase Admin ===
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@<project>.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# === NEAR AI Cloud ===
NEAR_AI_API_KEY=near-ai-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEAR_AI_BASE_URL=https://cloud-api.near.ai/v1

# === Google Gemini ===
GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === Email (Gmail SMTP) ===
EMAIL_SERVER_USER=your-email@gmail.com
EMAIL_SERVER_PASSWORD=app-password-16-char
EMAIL_FROM=YourTrust <your-email@gmail.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === Radar.io Location ===
NEXT_PUBLIC_RADAR_PUBLISHABLE_KEY=prj_test_pk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# === Make.com Voice AI Webhook ===
MAKE_CALL_WEBHOOK_URL=https://hook.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Running the Project

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Edit .env.local with your credentials
# - Get Firebase config from Firebase Console
# - Get MongoDB URI from MongoDB Atlas
# - Get NEAR AI key from NEAR AI Cloud
# - Get Gemini key from Google AI Studio

# Run development server
npm run dev
# Opens at http://localhost:3000

# Build for production
npm run build

# Start production server
npm start
```

---

*Documentation generated from complete source code analysis — covers all ~40 API routes, 6 models, ~60 UI components, 3 AI integrations, and all workflows.*
