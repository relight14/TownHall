import { useQuery } from '@tanstack/react-query';
import { siteSettingsKeys } from './queryKeys';
import { captureError, getRequestId } from '../../lib/errorTracking';
import { useErrorContext } from '../useErrorContext';
import type { ApiSiteSettings as SiteSettings } from '@shared/types';

export type { SiteSettings };

const defaultSiteSettings: SiteSettings = {
  heroHeading: "Nurturing artists.\nShaping culture.",
  heroSubheading: "Accessible space, community, and education for artists of all levels, mediums, and backgrounds—transforming society through the power of culture.",
};

/**
 * Query hook to fetch site settings
 */
export function useSiteSettings() {
  const errorCtx = useErrorContext();
  return useQuery<SiteSettings>({
    queryKey: siteSettingsKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/site-settings');
      if (!res.ok) {
        // Capture the error but return defaults (non-critical)
        const error = new Error('Failed to fetch site settings');
        captureError(error, { component: 'useSiteSettings', action: 'fetch_settings', requestId: getRequestId(res), ...errorCtx });
        return defaultSiteSettings;
      }
      const data = await res.json();
      return {
        heroHeading: data.heroHeading || defaultSiteSettings.heroHeading,
        heroSubheading: data.heroSubheading || defaultSiteSettings.heroSubheading,
      };
    },
    // Use defaults as initial data
    initialData: defaultSiteSettings,
  });
}
