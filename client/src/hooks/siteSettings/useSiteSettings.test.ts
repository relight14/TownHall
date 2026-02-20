import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSiteSettings } from './useSiteSettings';
import { createHookWrapper } from '../../test/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '../../test/mocks/server';

describe('useSiteSettings', () => {
  it('returns site settings from the API', async () => {
    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createHookWrapper(),
    });

    // initialData makes isSuccess immediately true, so wait for fetched data
    await waitFor(() => {
      expect(result.current.data!.heroHeading).toBe('Test Hero Heading');
    });

    expect(result.current.data!.heroSubheading).toBe('Test Hero Subheading');
  });

  it('has initial data (defaults) immediately', () => {
    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createHookWrapper(),
    });

    // initialData is set, so data is available immediately
    expect(result.current.data).toBeDefined();
    expect(result.current.data!.heroHeading).toContain('Nurturing artists');
  });

  it('falls back to defaults when API returns error', async () => {
    server.use(
      http.get('/api/site-settings', () => new HttpResponse(null, { status: 500 })),
    );

    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // queryFn catches errors and returns defaults
    expect(result.current.data!.heroHeading).toContain('Nurturing artists');
  });

  it('fills in missing fields with defaults', async () => {
    server.use(
      http.get('/api/site-settings', () =>
        HttpResponse.json({ heroHeading: 'Custom Heading' }),
      ),
    );

    const { result } = renderHook(() => useSiteSettings(), {
      wrapper: createHookWrapper(),
    });

    await waitFor(() => expect(result.current.data!.heroHeading).toBe('Custom Heading'));

    // heroSubheading should use default when empty/missing
    expect(result.current.data!.heroSubheading).toContain('Accessible space');
  });
});
