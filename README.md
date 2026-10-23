# Folio — Local-first Resume Studio

The complete, tested Folio source is included as a SHA-256-verified package in `payload/`. The one-time unpacker is provided because GitHub Actions has not yet expanded the source automatically. **There is no database, Supabase, Vercel or required API key.**

## Run on your Mac

1. Install Node.js 20 or newer, if necessary.
2. Open Terminal and run:

```bash
git clone https://github.com/divyam9308/Cv-builder.git
cd Cv-builder
npm start
```

3. Open **http://127.0.0.1:4173**.

On the first run, `npm start` verifies the packaged application's SHA-256 checksum, extracts the real `public/`, `server/`, `tests/` and other source files, and starts the site. On later runs it uses the application directly. The first-run extraction is **entirely offline** and uses only Node.js and the built-in `tar` command. No `npm install` is required.

## Configure Gemini (optional)

After the first run, stop the server and copy `.env.example` to `.env`. Put your own key in `GEMINI_API_KEY` and optionally set `GEMINI_MODEL`. Restart `npm start`. Never commit your `.env` file. Without a key, the local adaptive interview, manual editor, resume library, templates and exports all work; optional Gemini calls are disabled.

## Features

- ATS-inspired navy `#001264` and gold `#DAB111` workspace
- Multiple resumes, autosave in local browser storage, duplication, backup and restore
- Experience, education, projects, achievements, certifications, skills and job-description tailoring
- Evidence-led follow-up interview with local rules and optional Gemini-generated questions/rewording
- Explicit user approval of proposed bullet improvements
- Five resume templates: Oxford, Northstar, Ledger, Atelier, Clarity
- Automatic multi-page PDF and editable DOCX outputs

After the first run, verify with `npm run check` (21 automated tests), `npm run samples` (12 example files), and, if Chromium/Playwright are installed, `python tests/browser_qa.py`. The full README in the extracted source documents limitations, privacy, sample data and export behavior.

**Important:** This is a locally running single-user website. The browser stores resumes locally, so export a JSON backup regularly. Direct PDF output is best suited to Latin text; Unicode-rich documents can use DOCX or browser print-to-PDF.
