# Featured Episodes Hooks

This directory contains all hooks related to featured episodes data management using TanStack Query.

## Files

- **`useFeaturedEpisodes.ts`** - Query hook for fetching featured episodes
- **`useFeaturedEpisodesMutations.ts`** - Mutation hook for updating featured episodes
- **`queryKeys.ts`** - Query key constants
- **`index.ts`** - Barrel export

## Usage

### Fetching Featured Episodes

```typescript
import { useFeaturedEpisodes } from '../hooks/featuredEpisodes';

const { data: featuredEpisodes = [], isLoading } = useFeaturedEpisodes();
```

### Updating Featured Episodes (Admin)

```typescript
import { useSetFeaturedEpisodes } from '../hooks/featuredEpisodes';

const adminToken = sessionStorage.getItem('adminToken');
const setFeaturedEpisodes = useSetFeaturedEpisodes(adminToken);

setFeaturedEpisodes.mutate(['episode-id-1', 'episode-id-2'], {
  onSuccess: () => console.log('Updated!'),
});
```

## Cache Invalidation

Mutations automatically invalidate the featured episodes query cache, ensuring data stays fresh across all components.
