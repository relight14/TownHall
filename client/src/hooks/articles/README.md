# Articles Hooks

This directory contains all hooks related to article data management using TanStack Query.

## Files

- **`useArticles.ts`** - Query hooks for fetching articles
- **`useArticleMutations.ts`** - Mutation hooks for creating, updating, and deleting articles
- **`queryKeys.ts`** - Query key constants
- **`index.ts`** - Barrel export

## Usage

### Fetching Articles

```typescript
import { useArticles, useFeaturedArticles, useLatestArticles, useMostReadArticles } from '../hooks/articles';

// All articles
const { data: articles = [], isLoading } = useArticles();

// Featured articles
const { data: featured = [] } = useFeaturedArticles();

// Latest articles (with limit)
const { data: latest = [] } = useLatestArticles(5);

// Most read articles
const { data: mostRead = [] } = useMostReadArticles(5);
```

### Creating/Updating Articles (Admin)

```typescript
import { useCreateArticle, useUpdateArticle, useDeleteArticle } from '../hooks/articles';

const adminToken = sessionStorage.getItem('adminToken');
const createArticle = useCreateArticle(adminToken);
const updateArticle = useUpdateArticle(adminToken);
const deleteArticle = useDeleteArticle(adminToken);

// Create
createArticle.mutate(articleData);

// Update
updateArticle.mutate({ id: articleId, title: 'New Title' });

// Delete
deleteArticle.mutate(articleId);
```

## Cache Invalidation

All mutations automatically invalidate article queries, ensuring data stays fresh across all components.
