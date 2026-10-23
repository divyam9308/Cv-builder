# Folio — Local Resume Studio

A local-first resume builder inspired by the restrained navy-and-gold design language of Fyndbridge ATS. It focuses on **credible, evidence-led resumes** instead of generic AI-generated prose.

![Status: local-first](https://img.shields.io/badge/runtime-local--first-001264) ![Dependencies: zero](https://img.shields.io/badge/runtime%20npm%20dependencies-0-DAB111)

## Run locally

**Requirements:** Node.js 20 or later. No database, Supabase account, Vercel deployment, Docker or `npm install` is needed.

```bash
# Clone your repository
 git clone https://github.com/divyam9308/Cv-builder.git
 cd Cv-builder

# Start at http://127.0.0.1:4173
 npm start
```

Open **http://127.0.0.1:4173** in your browser. `npm run dev` adds Node file watching. The initial workspace includes an explicitly labeled sample resume; create a blank one through **New resume**. The local development server binds to loopback only.

## Optional Gemini integration

1. Create a Gemini key in [Google AI Studio](https://aistudio.google.com/api-keys).
2. Copy `.env.example` to `.env` in the project root.
3. Set `GEMINI_API_KEY=your_key` in `.env` (never commit this file).
4. Check that `GEMINI_MODEL` names a model available to your key. The example uses `gemini-3.5-flash-lite`; you may change it.
5. Restart `npm start` and open **Settings & data** to confirm that Gemini is configured.

**No key is needed for local resume editing, rule-based interview questions, template selection or PDF/DOCX exports.** The Gemini buttons explicitly opt into sending selected resume details/job descriptions to Google's API. The key remains server-side. The app does not call Gemini in the background as you type.

**Security:** treat the `.env` file as sensitive; the local server is not hardened as a hosted multi-tenant service. It includes loopback binding, CSP, same-origin POST protection, bounded JSON requests, and a basic in-memory rate limit, but is intended for localhost only.

## Complete workflow

| Module | Included |
|---|---|
| Resume library | Create, edit, rename, duplicate and delete multiple resumes |
| Resume editor | Contact, title, summary, work and internships, education, projects, skills, certifications, awards and job description |
| Live preview | Immediate updates, five visual themes, A4-style reading surface |
| Interview | Contextual local follow-ups for vague bullets, missing impact, methods, projects, summary and skills; optional deeper Gemini questions |
| AI rewrite | Optional single-bullet rewrite, numerical evidence guard and explicit accept step |
| Job tailoring | Simple term overlap view, deliberately **not** a fabricated ATS score |
| PDF | Selectable-text, A4/Letter and automatic multi-page continuation |
| DOCX | Editable Microsoft Word-compatible OOXML with document pagination |
| Data | Browser localStorage autosave, JSON backup/restore, no database |
| QA | Node tests, optional local browser QA, five sample exports, GitHub Actions |

Resume templates: **Oxford** (traditional), **Northstar** (modern), **Ledger** (executive), **Atelier** (subtle creative), **Clarity** (minimal). These are independently authored designs; names and layouts are not copies of third-party templates.

## Paper length and formatting

- The website intentionally **does not force everything onto one page**. Exports flow to additional pages as necessary.
- The page-count selector represents the user's preference for a future content-editing pass; it does **not** silently discard content or guarantee a specific number of pages.
- The browser's continuous preview is not a perfect simulation of Word/PDF page breaks. Always review the exported document before sending it.
- The built-in minimal PDF engine uses the standard PDF Base-14 Latin font set. For names or body text requiring non-Latin glyphs (e.g., Devanagari), use the **Browser print preview → Save as PDF** (uses system fonts) or export DOCX, which preserves Unicode text. Direct PDF export is intentionally dependency-free and has limited non-Latin glyph coverage.
- Word/Docs may reflow DOCX differently according to installed fonts and office version.

## Tests

```bash
npm run check                # JS syntax + 21 unit/integration tests
npm run samples              # 5 PDFs + 5 DOCXs + long-form fixtures
python tests/browser_qa.py   # Optional: requires Python Playwright + Chromium
```

The browser QA harness instrumentally mounts the same JS/CSS in Chromium because the isolated test sandbox disallows URL navigation, and exercises interaction flows. HTTP endpoints are separately integration-tested in Node.

`npm run samples` writes generated example documents to `samples/output/` (ignored by Git). The GitHub Actions workflow runs `npm run check` and attaches generated examples as a downloadable workflow artifact.

## Privacy and honesty

- This is a **single-device** personal app, not a production SaaS. localStorage is per browser profile and can be cleared by the browser. Back up important resumes as JSON.
- The local interview is rules-based, not a hidden LLM. Gemini availability and errors are visible. No success claim is made without a model response.
- Resume suggestions are proposed rather than silently inserted. Users should review all claims for factual accuracy.
- AI may still phrase unsupported implications despite safeguards; the final resume is the user's responsibility.
- Never store API keys in resume JSON. The only required server secret is read from `.env`.

## References informing the design

- [Harvard Career Services: Creating a Strong Resume](https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/) — specific, fact-based accomplishment bullets.
- [Harvard FAS: Resume/CV Templates](https://careerservices.fas.harvard.edu/resources/category/resume-cv-cover-letter-templates/) — clear conventional headings.
- [CareerOneStop: Resume Formatting](https://cloudfront.careeronestop.org/JobSearch/Resumes/ResumeGuide/formatting.aspx) — accessible, consistent single-column layout.
- [Google Gemini API: generateContent REST](https://ai.google.dev/api/generate-content) — server-side API integration.

---

**Local-first by design. No Supabase. No Vercel. No required API key.**
