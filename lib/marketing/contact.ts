export type PublicContactLinkKind =
  | "email"
  | "instagram"
  | "linkedin-company"
  | "linkedin-founder"
  | "whatsapp";

export type PublicContactLink = {
  kind: PublicContactLinkKind;
  label: string;
  href: string;
  sameAs: boolean;
};

export const TREXITI_CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_TREXITI_CONTACT_EMAIL?.trim() ||
  "hello@trexiti.com";

const linkedInCompanyUrl =
  process.env.NEXT_PUBLIC_TREXITI_LINKEDIN_COMPANY_URL?.trim() || null;
const founderLinkedInUrl =
  process.env.NEXT_PUBLIC_AL_NEVILLE_HALL_LINKEDIN_URL?.trim() || null;
const instagramUrl =
  process.env.NEXT_PUBLIC_TREXITI_INSTAGRAM_URL?.trim() ||
  "https://www.instagram.com/trexiti/";

const configuredWhatsAppNumber =
  process.env.NEXT_PUBLIC_TREXITI_WHATSAPP_NUMBER?.trim() ?? "";

export const TREXITI_WHATSAPP_NUMBER = configuredWhatsAppNumber || null;

export function createWhatsAppUrl(message: string) {
  if (!TREXITI_WHATSAPP_NUMBER) {
    return null;
  }

  const digits = TREXITI_WHATSAPP_NUMBER.replace(/\D/g, "");

  if (digits.length < 8) {
    return null;
  }

  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function optionalSocialLink(
  kind: PublicContactLinkKind,
  label: string,
  href: string | null,
) {
  return href ? [{ kind, label, href, sameAs: true } satisfies PublicContactLink] : [];
}

const generalWhatsAppUrl = createWhatsAppUrl(
  "Hello Trexiti, I would like to discuss what should work better in my business.",
);

export const publicContactLinks = [
  {
    kind: "email",
    label: TREXITI_CONTACT_EMAIL,
    href: `mailto:${TREXITI_CONTACT_EMAIL}`,
    sameAs: false,
  },
  ...optionalSocialLink(
    "linkedin-company",
    "LinkedIn / Trexiti",
    linkedInCompanyUrl,
  ),
  ...optionalSocialLink(
    "linkedin-founder",
    "LinkedIn / Al Neville Hall",
    founderLinkedInUrl,
  ),
  {
    kind: "instagram",
    label: "Instagram / @trexiti",
    href: instagramUrl,
    sameAs: true,
  },
  ...(generalWhatsAppUrl
    ? [
        {
          kind: "whatsapp",
          label: "WhatsApp",
          href: generalWhatsAppUrl,
          sameAs: false,
        } satisfies PublicContactLink,
      ]
    : []),
] satisfies readonly PublicContactLink[];

export const organizationSocialProfileUrls = publicContactLinks
  .filter((link) => link.sameAs)
  .map((link) => link.href);
