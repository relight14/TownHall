import { useQuery } from "@tanstack/react-query";

interface SSOUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  ledewireToken?: string;
}

export function useAuth() {
  const { data: user, isLoading, error } = useQuery<SSOUser>({
    queryKey: ["/api/auth/user"],
    retry: false,
    refetchOnWindowFocus: false,
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
  };
}
