import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Prisma User model
export interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN" | "QC" | "TL" | "TL_QC";
  bio: string | null;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export function useAuth(requireAuth = false) {
  const router = useRouter();

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      try {
        // get current user route
        const res = await api.get<User>("auth/me"); 
        return res.data;
      } catch (err) {
        return null;
      }
    },
    retry: false,
  });

  // Redirect if auth is required but user is not found
  useEffect(() => {
    if (requireAuth && !isLoading && !user) {
      router.push("/login");
    }
  }, [requireAuth, isLoading, user, router]);

  return { user, isLoading, isError };
}