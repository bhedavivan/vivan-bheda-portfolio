import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/* ============================================================
   Forgiving field helpers
   ------------------------------------------------------------
   Content is edited by hand and through the CMS, so a small
   formatting slip (quoted numbers, blank values, bare keys,
   YAML auto-typing) must never take down a deploy. These
   helpers normalize all of that before validation. Dates stay
   strict AFTER normalization on purpose: a date we can't
   confidently parse would silently mis-sort the timeline,
   which is worse than a loud build error.
   ============================================================ */

// Required text: numbers become strings ("3.8"), blank/missing becomes "".
// Pages hide empty values, so a missing title degrades gracefully.
const text = z.preprocess((v) => (v === null || v === undefined ? '' : v), z.coerce.string());

// Optional text: blank, bare key ("gpa:"), or missing all mean "not set".
const optionalText = z.preprocess(
  (v) => (v === null || v === undefined || String(v).trim() === '' ? undefined : v),
  z.coerce.string().optional(),
);

// List of strings (techStack, bullets): accepts a real YAML list, a single
// value, or a comma-separated string; blank/missing becomes an empty list.
const textList = z.preprocess((v) => {
  if (v === null || v === undefined) return [];
  if (Array.isArray(v)) return v;
  return String(v)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}, z.array(z.coerce.string()));

// Checkbox (featured): tolerates quoted "true"/"false", yes/no, 1/0, blanks.
const flag = z.preprocess((v) => {
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    if (s === '') return undefined;
    return ['true', 'yes', '1'].includes(s);
  }
  if (typeof v === 'number') return v !== 0;
  return v ?? undefined;
}, z.boolean().default(false)).catch(false);

// Optional order number: "1" is coerced to 1, blanks are unset, and
// anything unparseable falls back to unset (recency sort) rather than
// failing the build.
const orderNumber = z
  .preprocess((v) => (v === '' || v === null ? undefined : v), z.coerce.number().optional())
  .catch(undefined);

/* ============================================================
   Date standard
   ------------------------------------------------------------
   Stored as "YYYY-MM" or "YYYY-MM-DD" ("Present" allowed where
   noted); displayed as MM/YYYY or MM/DD/YYYY via utils/dates.ts.
   ISO storage keeps plain string comparison chronologically
   correct for sorting (see utils/sorting.ts).

   normalizeDate repairs the realistic input slips first:
   - unquoted full dates (YAML turns 2025-03-15 into a Date object)
   - display-format input: "06/2026" or "06/15/2026"
   - stray spaces and lowercase/uppercase "present"
   A date that STILL doesn't match fails the build on purpose.
   ============================================================ */
const normalizeDate = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'number') return String(v);
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (/^present$/i.test(s)) return 'Present';
  const monthYear = s.match(/^(\d{1,2})\/(\d{4})$/);
  if (monthYear) return `${monthYear[2]}-${monthYear[1].padStart(2, '0')}`;
  const monthDayYear = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (monthDayYear) {
    return `${monthDayYear[3]}-${monthDayYear[1].padStart(2, '0')}-${monthDayYear[2].padStart(2, '0')}`;
  }
  return s;
};

const dateFormat = z
  .string()
  .regex(
    /^\d{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?)?$/,
    'Dates must use "YYYY", "YYYY-MM", or "YYYY-MM-DD" format, e.g. "2023", "2026-06", or "2026-06-15"',
  );
const yearMonth = z.preprocess(normalizeDate, dateFormat);
const yearMonthOrPresent = z.preprocess(
  normalizeDate,
  z.union([dateFormat, z.literal('Present')]),
);

// The [^_] in the pattern excludes files whose names start with "_"
// (e.g. _TEMPLATE.md), so template files can never load or render.
const contentGlob = (folder: string) =>
  glob({ pattern: '**/[^_]*.md', base: `./src/content/${folder}` });

/* === COLLECTIONS (repeatable, one Markdown file per entry) === */

const education = defineCollection({
  loader: contentGlob('education'),
  schema: z.object({
    institution: text,
    degree: text,
    field: text,
    startDate: yearMonth,
    endDate: yearMonthOrPresent,
    gpa: optionalText,
    notes: optionalText,
  }),
});

const projects = defineCollection({
  loader: contentGlob('projects'),
  schema: z.object({
    title: text,
    description: text,
    techStack: textList,
    repoUrl: text,
    liveUrl: optionalText,
    imageUrl: optionalText,
    featured: flag,
    order: orderNumber,
  }),
});

// One experience entry = one company; roles held there are a nested list
// (LinkedIn-style). Role dates stay strict-after-normalization like all
// other dates; a company with zero roles renders as just a header.
const role = z.object({
  title: text,
  startDate: yearMonth,
  endDate: yearMonthOrPresent,
  bullets: textList,
});

const experiences = defineCollection({
  loader: contentGlob('experiences'),
  schema: z.object({
    company: text,
    location: text,
    roles: z.preprocess(
      (v) => (v === null || v === undefined ? [] : Array.isArray(v) ? v : [v]),
      z.array(role),
    ),
  }),
});

const certificates = defineCollection({
  loader: contentGlob('certificates'),
  schema: z.object({
    name: text,
    issuer: text,
    dateEarned: yearMonth,
    // Badge/logo image; falls back to the issuer's initial when absent.
    imageUrl: optionalText,
    credentialId: optionalText,
    credentialUrl: optionalText,
  }),
});

const awards = defineCollection({
  loader: contentGlob('awards'),
  schema: z.object({
    title: text,
    issuer: text,
    date: yearMonth,
    description: optionalText,
  }),
});

/* === SINGLETONS (exactly one editable file each) === */

const home = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content/home' }),
  schema: z.object({
    heroHeading: text,
    heroSubheading: text,
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/about' }),
  schema: z.object({
    heading: optionalText,
  }),
});

const contact = defineCollection({
  loader: glob({ pattern: 'contact.md', base: './src/content/contact' }),
  schema: z.object({
    // All hide-if-blank on the site, so blanking any of these is safe.
    linkedinUrl: text,
    githubUrl: text,
    email: text,
    phone: optionalText,
  }),
});

const resume = defineCollection({
  loader: glob({ pattern: 'resume.md', base: './src/content/resume' }),
  schema: z.object({
    pdfPath: z.preprocess(
      (v) => (v === null || v === undefined || String(v).trim() === '' ? undefined : v),
      z.coerce.string().default('/resume.pdf'),
    ),
  }),
});

// Site-wide toggles editable from the CMS (e.g. hide the Awards page until
// there's content to show). Missing file / blank value defaults to hidden.
const settings = defineCollection({
  loader: glob({ pattern: 'settings.md', base: './src/content/settings' }),
  schema: z.object({
    showAwards: flag,
  }),
});

export const collections = {
  education,
  projects,
  experiences,
  certificates,
  awards,
  home,
  about,
  contact,
  resume,
  settings,
};
