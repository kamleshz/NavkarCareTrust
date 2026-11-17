import { headers } from "next/headers";
import type { Metadata } from "next";
import { OrganisationApplicationForm } from "@/components/organisation-application-form";
import { QrPreview } from "@/components/qr-preview";
import { generateOrganisationQr, getOrganisationRegisterUrl, getPublicBaseUrl } from "@/lib/qr";

export const metadata: Metadata = {
  title: "Join the Navkar Care Trust Support Network",
  description:
    "Register as a pharmaceutical company, doctor, trust, NGO, temple, industry, or political party to support cancer care.",
};

export default async function ForOrganisationsRegisterPage() {
  const headerList = await headers();
  const baseUrl = getPublicBaseUrl({ get: (name) => headerList.get(name) });
  const registerUrl = getOrganisationRegisterUrl(baseUrl);
  const qr = await generateOrganisationQr(registerUrl);

  return (
    <main className="join-page">
      <div className="shell join-layout org-apply-layout">
        <section className="join-intro">
          <p className="eyebrow">For organisations</p>
          <h1>Join the Navkar Care Trust Support Network</h1>
          <p className="join-lead">
            Select how you would like to participate. Your registration will be reviewed privately before
            any public listing is published.
          </p>
          <div className="review-steps">
            <div>
              <span>1</span>
              <p>
                <strong>Select type</strong>
                Choose the way you can support patients and families.
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                <strong>Register</strong>
                Share your details and the support you can offer.
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                <strong>Review</strong>
                Our team reviews your registration in private.
              </p>
            </div>
          </div>

          <div className="qr-share-card">
            <h3>Share this registration</h3>
            <p>Scan the QR code or copy the link to invite organisations to join.</p>
            <QrPreview url={qr.url} pngDataUrl={qr.pngDataUrl} svg={qr.svg} />
          </div>
        </section>

        <section className="form-card" aria-labelledby="org-apply-title">
          <div className="form-card-heading">
            <h2 id="org-apply-title">Organisation registration</h2>
            <p>Complete one short form. We will contact you using the details you provide.</p>
          </div>
          <OrganisationApplicationForm />
        </section>
      </div>
    </main>
  );
}
