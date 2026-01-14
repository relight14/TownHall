# Series Hooks

This directory contains all hooks related to series data management using TanStack Query.

## Files

- **`useSeries.ts`** - Query hook for fetching all series
- **`useSeriesMutations.ts`** - Mutation hooks for creating, updating, and deleting series/episodes
- **`queryKeys.ts`** - Query key constants following TanStack Query best practices
- **`index.ts`** - Barrel export for all series hooks and types

## Query Keys

All query keys are centralized in `queryKeys.ts` following TanStack Query best practices:

```typescript
import { seriesKeys } from './queryKeys';

// Use in queries
queryKey: seriesKeys.api.all

// Use in mutations for invalidation
queryClient.invalidateQueries({ queryKey: seriesKeys.api.all });
```

### Benefits

- **Type Safety**: TypeScript autocomplete and type checking
- **Single Source of Truth**: All keys defined in one place
- **Easier Refactoring**: Change once, updates everywhere
- **No Typos**: Constants prevent string typos
- **Hierarchical Structure**: Ready for future expansion

## Usage Examples

### Fetching Series

```typescript
import { useSeries } from '../hooks/series';

function MyComponent() {
  const { data: series = [], isLoading, error } = useSeries();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {series.map(s => (
        <div key={s.id}>{s.title}</div>
      ))}
    </div>
  );
}
```

### Creating a Series

```typescript
import { useCreateSeries } from '../hooks/series';

function CreateSeriesForm() {
  const adminToken = sessionStorage.getItem('adminToken');
  const createSeries = useCreateSeries(adminToken);
  
  const handleSubmit = (data) => {
    createSeries.mutate(data, {
      onSuccess: () => {
        console.log('Series created!');
      },
      onError: (error) => {
        console.error('Failed:', error);
      }
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button disabled={createSeries.isPending}>
        {createSeries.isPending ? 'Creating...' : 'Create Series'}
      </button>
    </form>
  );
}
```

### Updating a Series

```typescript
import { useUpdateSeries } from '../hooks/series';

function EditSeriesForm({ seriesId, initialData }) {
  const adminToken = sessionStorage.getItem('adminToken');
  const updateSeries = useUpdateSeries(adminToken);
  
  const handleSubmit = (updates) => {
    updateSeries.mutate(
      { id: seriesId, ...updates },
      {
        onSuccess: () => {
          console.log('Series updated!');
        }
      }
    );
  };
  
  // ... form implementation
}
```

### Creating an Episode

```typescript
import { useCreateEpisode } from '../hooks/series';

function CreateEpisodeForm({ seriesId }) {
  const adminToken = sessionStorage.getItem('adminToken');
  const createEpisode = useCreateEpisode(adminToken);
  
  const handleSubmit = (episodeData) => {
    createEpisode.mutate(
      { seriesId, ...episodeData },
      {
        onSuccess: () => {
          console.log('Episode created!');
        }
      }
    );
  };
  
  // ... form implementation
}
```

## Types

All types are exported from `useSeries.ts`:

```typescript
import type { Series, Episode } from '../hooks/series';

// Series interface
interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  trailerUrl?: string;
  trailerType?: 'vimeo' | 'youtube';
  episodes: Episode[];
}

// Episode interface
interface Episode {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoType: 'vimeo' | 'youtube';
  price: number;
  thumbnail: string;
  ledewireContentId?: string;
}
```

## Cache Invalidation

All mutations automatically invalidate the series query cache, ensuring data stays fresh:

- `useCreateSeries` - Invalidates on success
- `useUpdateSeries` - Invalidates on success
- `useCreateEpisode` - Invalidates on success (episodes are part of series)
- `useUpdateEpisode` - Invalidates on success
- `useDeleteEpisode` - Invalidates on success

This means after any mutation, all components using `useSeries()` will automatically refetch the latest data.

## Context Functions

The context (`VideoStoreProvider`) still provides mutation functions for backward compatibility:
- `addSeries()`
- `updateSeries()`
- `addEpisode()`
- `updateEpisode()`
- `deleteEpisode()`

These functions also invalidate the query cache using `seriesKeys.api.all`, ensuring consistency whether you use hooks or context functions.
