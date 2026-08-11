import { projectSummaries } from "@/lib/content/projects";

export const homepageProjects = projectSummaries.map((project) => ({
  index: project.index,
  title: project.title,
  slug: project.slug,
  descriptor: project.descriptor,
  category: project.category,
  description: project.summary,
  visual: project.visual,
}));

export type HomepageProject = (typeof homepageProjects)[number];

export const positioningInputs = [
  {
    title: "Customers",
    description: "What people need, expect, and experience at every step.",
  },
  {
    title: "Processes",
    description: "How work moves through the business—and where it stops.",
  },
  {
    title: "People",
    description: "Who owns decisions, handoffs, exceptions, and outcomes.",
  },
  {
    title: "Data",
    description: "What the company knows, duplicates, misses, and needs to see.",
  },
  {
    title: "Bottlenecks",
    description: "The friction that quietly limits service, speed, and growth.",
  },
] as const;

export const systemsMethod = [
  {
    index: "01",
    title: "Discover",
    description: "Understand the company, users, workflows, and objectives.",
  },
  {
    index: "02",
    title: "Map",
    description: "Document processes, pain points, data, and dependencies.",
  },
  {
    index: "03",
    title: "Design",
    description: "Define the experience, system architecture, and workflows.",
  },
  {
    index: "04",
    title: "Build",
    description: "Engineer the product using reliable modern technology.",
  },
  {
    index: "05",
    title: "Integrate",
    description: "Connect the system to the business's existing tools.",
  },
  {
    index: "06",
    title: "Improve",
    description: "Use real operational feedback to refine the system.",
  },
] as const;

export const businessProblems = [
  "Your team relies heavily on spreadsheets.",
  "Customer information lives across WhatsApp, email, and notebooks.",
  "You can't clearly see what work is completed, outstanding or paid.",
  "Employees repeatedly enter the same information into different systems.",
  "Customers have no easy digital way to interact with the company.",
  "Your current website no longer reflects the quality of the business.",
  "You've outgrown off-the-shelf software.",
  "Your business needs software designed around its actual workflows.",
] as const;

export const engineeringCapabilities = [
  {
    title: "Experience",
    items: ["Web", "Mobile-ready systems", "Customer portals"],
  },
  {
    title: "Systems",
    items: ["Databases", "APIs", "Cloud infrastructure"],
  },
  {
    title: "Commerce",
    items: ["Payments", "Analytics", "Reporting"],
  },
  {
    title: "Operations",
    items: ["Integrations", "Webhooks", "Automation"],
  },
] as const;

export const technologyStack = [
  "Next.js",
  "React",
  "TypeScript",
  "Node",
  "PostgreSQL",
  "Neon",
  "Vercel",
  "REST APIs",
  "Webhooks",
  "Payment APIs",
  "Mapping APIs",
  "Email APIs",
] as const;
