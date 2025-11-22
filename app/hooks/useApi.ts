/**
 * useApi Hook
 * Custom hook for handling API calls with loading and error states
 */

import { useCallback, useState } from 'react';
import { ApiResponse } from '../types/api';
import { getErrorMessage } from '../utils/errorHandler';

interface UseApiReturn<T> {
  execute: (apiCall: () => Promise<ApiResponse<T>>) => Promise<ApiResponse<T> | null>;
  loading: boolean;
  error: string | null;
  data: T | null;
  clearError: () => void;
}

export const useApi = <T = any>(): UseApiReturn<T> => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T> | null> => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiCall();

        if (response.status.rem === 'success' && response.data !== null) {
          setData(response.data);
          return response;
        } else {
          const errorMessage = response.status.msg || 'Request failed';
          setError(errorMessage);
          throw new Error(errorMessage);
        }
      } catch (err: any) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { execute, loading, error, data, clearError };
};

