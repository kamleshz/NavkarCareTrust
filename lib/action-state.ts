/**
 * Shared form-state shapes for the server actions.
 *
 * Server action modules are marked with `"use server"`, which only allows
 * async functions to be exported. The initial state values live here, in a
 * plain module, so client components can import them safely.
 */

export interface AccountFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ApplicationFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface PatientSupportFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface EnquiryFormState {
  success: boolean;
  message: string;
  reference?: string;
  errors?: Record<string, string[]>;
}

export interface OrganisationFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface ListingFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface AdminFormState {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
}

export interface OrganisationApplicationFormState {
  success: boolean;
  message: string;
  reference?: string;
  errors?: Record<string, string[]>;
}

export const initialAccountState: AccountFormState = { success: false, message: "" };
export const initialApplicationState: ApplicationFormState = { success: false, message: "" };
export const initialPatientSupportState: PatientSupportFormState = { success: false, message: "" };
export const initialEnquiryState: EnquiryFormState = { success: false, message: "" };
export const initialOrganisationState: OrganisationFormState = { success: false, message: "" };
export const initialListingState: ListingFormState = { success: false, message: "" };
export const initialAdminState: AdminFormState = { success: false, message: "" };
export const initialOrganisationApplicationState: OrganisationApplicationFormState = {
  success: false,
  message: "",
};
