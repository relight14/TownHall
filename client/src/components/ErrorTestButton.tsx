import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createErrorCapturer } from '@/lib/errorTracking';

// Create component-specific error capturer
const captureError = createErrorCapturer('ErrorTestButton');

// Simulates a response from an API that's missing expected data
interface ApiResponse {
  user?: {
    profile?: {
      name?: string;
    };
  };
}

export function ErrorTestButton() {
  const [lastError, setLastError] = useState<string | null>(null);

  const handleClick = () => {
    // Simulate fetching data that comes back incomplete/malformed
    const apiResponse: ApiResponse = {
      user: undefined, // API returned null/undefined user
    };

    try {
      // This is a common real-world error: accessing nested properties on undefined
      const userName = (apiResponse.user as any).profile.name;
      console.log('User name:', userName);
    } catch (error) {
      if (error instanceof Error) {
        const enrichedError = captureError(error, {
          action: 'access_user_profile',
          metadata: {
            api_response: apiResponse,
          },
        });

        setLastError(enrichedError.message);
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 items-end">
      <Button
        onClick={handleClick}
        className="bg-red-600 hover:bg-red-700 text-white border-red-700"
      >
        Test Error
      </Button>
      {lastError && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded max-w-xs truncate">
          {lastError}
        </div>
      )}
    </div>
  );
}
