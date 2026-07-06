import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Site-wide date standard: every date field is stored as "YYYY-MM" (e.g.
// "2026-06") or, if a specific day matters, "YYYY-MM-DD" (e.g. "2026-06-15"),
// or the literal "Present" where an end date allows it. ISO order keeps plain
// string comparison chronologically correct for sorting (see utils/sorting.ts).
// Pages format these for display as "MM/YYYY" or "MM/DD/YYYY" via
// utils/dates.ts — never render the raw stored string.
const yearMonth = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])(-(0[1-9]|[12]\d|3[01]))?$/,
    'Dates must use "YYYY-MM" or "YYYY-MM-DD" format, e.g. "2026-06" or "2026-06-15"',
  );
const yearMonthOrPresent = z.union([yearMonth, z.literal('Present')]);

// The [^_] in the pattern excludes files whose names start with "_"
// (e.g. _TEMPLATE.md), so template files can never load or render.
const contentGlob = (folder: string) =>
  glob({ pattern: '**/[^_]*.md', base: `./src/content/${folder}` });

/* === COLLECTIONS (repeatable, one Markdown file per entry) === */

const education = defineCollection({
  loader: contentGlob('education'),
  schema: z.object({
    institution: z.string(),
    degree: z.string(),
    field: z.string(),
    startDate: yearMonth,
    endDate: yearMonthOrPresent,
    gpa: z.string().optional(),
    notes: z.string().optional(),
  }),
});

const projects = defineCollection({
  loader: contentGlob('projects'),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    techStack: z.array(z.string()),
    repoUrl: z.string(),
    liveUrl: z.string().optional(),
    imageUrl: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().optional(),
  }),
});

const experiences = defineCollection({
  loader: contentGlob('experiences'),
  schema: z.object({
    company: z.string(),
    role: z.string(),
    startDate: yearMonth,
    endDate: yearMonthOrPresent,
    location: z.string(),
    bullets: z.array(z.string()),
  }),
});

const certificates = defineCollection({
  loader: contentGlob('certificates'),
  schema: z.object({
    name: z.string(),
    issuer: z.string(),
    dateEarned: yearMonth,
    credentialUrl: z.string().optional(),
  }),
});

const awards = defineCollection({
  loader: contentGlob('awards'),
  schema: z.object({
    title: z.string(),
    issuer: z.string(),
    date: yearMonth,
    description: z.string().optional(),
  }),
});

const skills = defineCollection({
  loader: contentGlob('skills'),
  schema: z.object({
    category: z.string(),
    items: z.array(z.string()),
    order: z.number().optional(),
  }),
});

/* === SINGLETONS (exactly one editable file each) === */

const home = defineCollection({
  loader: glob({ pattern: 'home.md', base: './src/content/home' }),
  schema: z.object({
    heroHeading: z.string(),
    heroSubheading: z.string(),
  }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content/about' }),
  schema: z.object({
    heading: z.string().optional(),
  }),
});

const contact = defineCollection({
  loader: glob({ pattern: 'contact.md', base: './src/content/contact' }),
  schema: z.object({
    linkedinUrl: z.string(),
    githubUrl: z.string(),
    email: z.string(),
    phone: z.string().optional(),
  }),
});

const resume = defineCollection({
  loader: glob({ pattern: 'resume.md', base: './src/content/resume' }),
  schema: z.object({
    pdfPath: z.string().default('/resume.pdf'),
  }),
});

export const collections = {
  education,
  projects,
  experiences,
  certificates,
  awards,
  skills,
  home,
  about,
  contact,
  resume,
};
