import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { VideoStoreProvider } from '@/context/VideoStoreContext';
import { getQueryFn } from '@/lib/queryClient';
import { type ReactElement, type ReactNode } from 'react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        queryFn: getQueryFn({ on401: 'throw' }),
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

interface WrapperOptions {
  initialEntries?: string[];
}

function createWrapper({ initialEntries = ['/'] }: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <VideoStoreProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </VideoStoreProvider>
      </QueryClientProvider>
    );
  };
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: string[];
}

export function renderWithProviders(
  ui: ReactElement,
  { initialEntries, ...renderOptions }: CustomRenderOptions = {},
) {
  const Wrapper = createWrapper({ initialEntries });
  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  };
}

/**
 * Create a wrapper for testing hooks with renderHook
 */
export function createHookWrapper({ initialEntries = ['/'] }: WrapperOptions = {}) {
  const queryClient = createTestQueryClient();

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <VideoStoreProvider>
          <MemoryRouter initialEntries={initialEntries}>
            {children}
          </MemoryRouter>
        </VideoStoreProvider>
      </QueryClientProvider>
    );
  };
}

/**
 * Render a component inside a route so useParams() works.
 * Example: renderWithRoute(<ArticlePage />, '/article/:articleId', '/article/123')
 */
interface RouteRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  routePath: string;
  initialPath: string;
}

export function renderWithRoute(
  ui: ReactElement,
  { routePath, initialPath, ...renderOptions }: RouteRenderOptions,
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <VideoStoreProvider>
          <MemoryRouter initialEntries={[initialPath]}>
            <Routes>
              <Route path={routePath} element={children} />
            </Routes>
          </MemoryRouter>
        </VideoStoreProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

export { default as userEvent } from '@testing-library/user-event';
export * from '@testing-library/react';
