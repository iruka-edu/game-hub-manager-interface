/**
 * GCS Management Hooks
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getGCSFoldersWithCache,
  deleteGCSFile,
  clearGCSCache,
} from "../api/gcsApi";

// Query keys
export const gcsKeys = {
  all: ["gcs"] as const,
  folders: () => [...gcsKeys.all, "folders"] as const,
  cache: () => [...gcsKeys.all, "cache"] as const,
};

/**
 * Hook to fetch GCS folders with caching
 */
export function useGCSFolders() {
  return useQuery({
    queryKey: gcsKeys.folders(),
    queryFn: getGCSFoldersWithCache,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

/**
 * Hook to delete GCS file
 */
export function useDeleteGCSFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (filePath: string) => deleteGCSFile(filePath),
    onSuccess: () => {
      // Invalidate and refetch GCS folders
      queryClient.invalidateQueries({ queryKey: gcsKeys.folders() });

      // Clear cache since data changed
      clearGCSCache("folders").catch(console.warn);

      console.log("GCS file deleted successfully");
    },
    onError: (error) => {
      console.error("Failed to delete GCS file:", error);
    },
  });
}

/**
 * Hook to refresh GCS data (clear cache and refetch)
 */
export function useRefreshGCS() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // Clear cache first
      await clearGCSCache("folders");

      // Then invalidate and refetch
      await queryClient.invalidateQueries({ queryKey: gcsKeys.folders() });

      return { success: true };
    },
    onSuccess: () => {
      console.log("GCS folders data refreshed");
    },
    onError: (error) => {
      console.error("Failed to refresh GCS folders data:", error);
    },
  });
}
