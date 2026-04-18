import { notFound } from 'next/navigation';
import { mergeCompanyWebsiteVisibility } from '@/lib/companyWebsiteVisibility';

/** Active public microsite only; throws notFound otherwise. */
export function requireActiveCompanyMicrosite(company) {
    if (!company?.website?.is_active) {
        notFound();
    }
    return mergeCompanyWebsiteVisibility(company.website.section_visibility);
}
