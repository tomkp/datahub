import { useQuery } from '@tanstack/react-query';
import { useApi } from '../lib/api';

export function useTenants() {
  const api = useApi();

  return useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.tenants.list(),
  });
}

export function useTenant(id: string) {
  const api = useApi();

  return useQuery({
    queryKey: ['tenants', id],
    queryFn: () => api.tenants.get(id),
    enabled: !!id,
  });
}
