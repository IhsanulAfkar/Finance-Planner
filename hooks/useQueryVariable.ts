import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export function useQueryVariable(keys: string[]) {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const values: Record<string, string | null> = {};
    keys.forEach((key) => {
      values[key] = searchParams.get(key);
    });

    return values;
  }, [searchParams, keys]);
}