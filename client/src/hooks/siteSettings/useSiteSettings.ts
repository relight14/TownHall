import { useQuery } from '@tanstack/react-query';
import { siteSettingsKeys } from './queryKeys';

export interface SiteSettings {
  heroHeading: string;
  heroSubheading: string;
}

const defaultSiteSettings: SiteSettings = {
  heroHeading: "Nurturing artists.\nShaping culture.",
  heroSubheading: "Accessible space, community, and education for artists of all levels, mediums, and backgrounds—transforming society through the power of culture.",
};

/**
 * Query hook to fetch site settings
 */
export function useSiteSettings() {
  return useQuery<SiteSettings>({
    queryKey: siteSettingsKeys.api.all,
    queryFn: async () => {
      const res = await fetch('/api/site-settings');
      if (!res.ok) {
        // Return defaults if fetch fails
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
