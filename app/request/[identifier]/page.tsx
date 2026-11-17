import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { EnquiryForm } from "@/components/enquiry-form";
import { requireUser } from "@/lib/auth/dal";
import { getPublishedResource } from "@/lib/resources";
import {
  enquiryTypeForCategory,
  enquiryTypeLabels,
  enquiryTypes,
  type EnquiryType,
} from "@/lib/types";

export const metadata: Metadata = { title: "Send a request" };

function resolveType(value: string | undefined, fallback: EnquiryType): EnquiryType {
  return enquiryTypes.includes(value as EnquiryType) ? (value as EnquiryType) : fallback;
}

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ identifier: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { identifier } = await params;
  const { type: typeParam } = await searchParams;

  const resource = await getPublishedResource(identifier);
  if (!resource) notFound();

  const type = resolveType(typeParam, enquiryTypeForCategory(resource.category));

  const user = await requireUser(
    `/request/${identifier}?type=${type}`,
  );

  const { phone, email, address } = resource.contactDetails;

  return (
    <main className="join-page">
      <div className="shell join-layout">
        <div className="join-intro">
          <p className="eyebrow">{enquiryTypeLabels[type]}</p>
          <h1>{resource.name}</h1>
          <p className="join-lead">{resource.description}</p>

          <div className="review-steps">
            <div>
              <span>1</span>
              <p>
                <strong>Share your request</strong>
                Give the details the organisation needs to respond.
              </p>
            </div>
            <div>
              <span>2</span>
              <p>
                <strong>Confirm consent</strong>
                Nothing is shared until you agree to send it.
              </p>
            </div>
            <div>
              <span>3</span>
              <p>
                <strong>Track the response</strong>
                Follow the status from your account. An appointment is confirmed only once the provider
                accepts it.
              </p>
            </div>
          </div>

          {(phone || email || address || resource.officialUrl) && (
            <div className="patient-safety-note">
              <strong>Official contact</strong>
              {address && <p>{address}</p>}
              {phone && <p>{phone}</p>}
              {email && <p>{email}</p>}
              {resource.officialUrl && (
                <p>
                  <a href={resource.officialUrl} target="_blank" rel="noreferrer">
                    {resource.actionLabel ?? "Official website"}
                  </a>
                </p>
              )}
            </div>
          )}

          <p className="privacy-note">
            <Link href="/support">Back to the directory</Link>
          </p>
        </div>

        <div className="form-card">
          <div className="form-card-heading">
            <h2>{enquiryTypeLabels[type]}</h2>
            <p>
              {resource.enquiriesEnabled
                ? "This organisation accepts requests through NavkarCareTrust."
                : "This listing is an external directory entry."}
            </p>
          </div>

          {resource.enquiriesEnabled ? (
            <EnquiryForm
              resource={resource}
              type={type}
              defaultName={user.fullName}
              defaultEmail={user.email}
              defaultPhone={user.phone}
            />
          ) : (
            <div className="panel-body">
              <p className="empty-note">
                This listing does not accept requests through NavkarCareTrust yet. Please use the official
                contact details or booking link shown on this page.
              </p>
              <p className="privacy-note">
                <Link className="button button-outline" href="/support">
                  Back to the directory
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
