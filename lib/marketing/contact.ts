export const TREXITI_CONTACT_EMAIL = "hello@trexiti.com";

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
