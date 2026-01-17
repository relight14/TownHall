# Site Settings Hooks

This directory contains all hooks related to site settings data management using TanStack Query.

## Files

- **`useSiteSettings.ts`** - Query hook for fetching site settings
- **`useSiteSettingsMutations.ts`** - Mutation hook for updating site settings
- **`queryKeys.ts`** - Query key constants
- **`index.ts`** - Barrel export

## Usage

### Fetching Site Settings

```typescript
import { useSiteSettings } from '../hooks/siteSettings';

const { data: siteSettings } = useSiteSettings();
// siteSettings.heroHeading
// siteSettings.heroSubheading
```

### Updating Site Settings (Admin)

```typescript
import { useUpdateSiteSettings } from '../hooks/siteSettings';

const adminToken = sessionStorage.getItem('adminToken');
const updateSiteSettings = useUpdateSiteSettings(adminToken);

updateSiteSettings.mutate({
  heroHeading: 'New Heading',
  heroSubheading: 'New Subheading',
}, {
  onSuccess: () => console.log('Updated!'),
});
```

## Cache Management

Mutations automatically update the cache using `setQueryData` for immediate UI updates, ensuring data stays fresh across all components.
