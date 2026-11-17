import QRCode from "qrcode";

export const ORG_REGISTER_PATH = "/for-organisations/register";

/**
 * Resolves the public base URL for the application.
 * Uses APP_BASE_URL when configured, otherwise derives it from the request.
 */
export function getPublicBaseUrl(headersLike?: { get(name: string): string | null }): string {
  const fromEnv = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  if (headersLike) {
    const host = headersLike.get("x-forwarded-host") || headersLike.get("host");
    const proto = headersLike.get("x-forwarded-proto") || "https";
    if (host) return `${proto}://${host}`;
  }

  // Fallback for static generation / build-time.
  return "https://navkarcaretrust.org";
}

export function getOrganisationRegisterUrl(baseUrl: string): string {
  return `${baseUrl}${ORG_REGISTER_PATH}`;
}

export interface GeneratedQr {
  url: string;
  pngDataUrl: string;
  svg: string;
}

/** Generates PNG and SVG versions of the QR code for the given URL. */
export async function generateOrganisationQr(url: string): Promise<GeneratedQr> {
  const [pngDataUrl, svg] = await Promise.all([
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
      color: { dark: "#4d358a", light: "#ffffff" },
    }),
    QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 2,
      color: { dark: "#4d358a", light: "#ffffff" },
    }),
  ]);

  return { url, pngDataUrl, svg };
}
