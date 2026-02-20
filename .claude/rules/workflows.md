# Common Workflows

---

## paths: src/**/*.ts, src/**/*.tsx

When adding new features or modifying existing ones, follow these patterns.

## Adding a New Video Feature

1. **API Endpoint** (`src/lib/api.ts`):
   ```typescript
   static async getVideoChapters(videoId: string): Promise<VideoChapter[]> {
     return this.fetchAPI<VideoChapter[]>(`/chapters/video/${videoId}`);
   }
   ```
2. **TanStack Query Hook** (`src/hooks/useVideoData.ts`):
   ```typescript
   export function useVideoChapters(videoId: string | null) {
     return useQuery({
       queryKey: ['video', 'chapters', videoId],
       queryFn: () => TruVideoAPI.getVideoChapters(videoId!),
       enabled: !!videoId,
       staleTime: 5 * 60 * 1000,
     });
   }
   ```
3. **UI Component** (`src/components/ChaptersPanel.tsx`):
   ```typescript
   import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
   import { useTranslation } from 'react-i18next';

   export function ChaptersPanel({ chapters, onSeekTo }) {
     const { t } = useTranslation();
     return (
       <Card>
         <CardHeader><CardTitle>{t('chapters.title')}</CardTitle></CardHeader>
         <CardContent>
           {chapters.map(ch => (
             <div onClick={() => onSeekTo(ch.timestamp)}>{ch.title}</div>
           ))}
         </CardContent>
       </Card>
     );
   }
   ```
4. **Integration** (`src/pages/Video.tsx`): Add query hook and render component
5. **Translations** (`public/locales/en.json`): Add keys under new namespace

## Adding a New ShadCN Component

1. Copy from https://ui.shadcn.com to `src/components/ui/[component].tsx`
2. Ensure imports use `@/` path alias
3. Uses project's Tailwind config and design tokens automatically

## Adding a New Page/Route

1. Create page in `src/pages/NewPage.tsx` with `useTranslation()` hook
2. Add route in `src/App.tsx`: `<Route path="/new-page" element={<NewPage />} />`
3. Add navigation link in `src/components/Header.tsx`
4. Add translation keys in `public/locales/en.json`

## Adding Analytics Tracking

1. **API Endpoint** (`src/lib/api.ts`): Add static method with `fetchAPI`
2. **Mutation Hook** (`src/hooks/useVideoData.ts`): Wrap in `useMutation` with `retry: 1`
3. **Use in Component**: Call `mutate()` on the event trigger

## Event Listener Cleanup Pattern

Use `AbortController` for all event listener cleanup in `useEffect`. Pass `{ signal }` to `addEventListener`, then call `controller.abort()` in the cleanup function. Check `signal.aborted` in timeout callbacks to prevent stale updates. See `src/components/TranscriptPanel.tsx` for reference implementation.
