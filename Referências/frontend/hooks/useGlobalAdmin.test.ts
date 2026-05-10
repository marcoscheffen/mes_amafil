import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGlobalAdmin } from './useGlobalAdmin';
import { isGlobalAdmin as checkGlobalAdmin } from '../services/globalAdminService';

vi.mock('../services/globalAdminService', () => ({
  isGlobalAdmin: vi.fn(),
}));

describe('useGlobalAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna false quando nao existe usuario', () => {
    const { result } = renderHook(() => useGlobalAdmin(null));

    expect(result.current.isGlobalAdmin).toBe(false);
    expect(checkGlobalAdmin).not.toHaveBeenCalled();
  });

  it('retorna true quando servico confirma global admin', async () => {
    vi.mocked(checkGlobalAdmin).mockResolvedValueOnce(true);

    const { result } = renderHook(() =>
      useGlobalAdmin({ id: 'user-1' } as any)
    );

    await waitFor(() => {
      expect(result.current.isGlobalAdmin).toBe(true);
    });
    expect(checkGlobalAdmin).toHaveBeenCalledTimes(1);
  });

  it('mantem false quando servico falha', async () => {
    vi.mocked(checkGlobalAdmin).mockRejectedValueOnce(new Error('falha'));

    const { result } = renderHook(() =>
      useGlobalAdmin({ id: 'user-2' } as any)
    );

    await waitFor(() => {
      expect(result.current.isGlobalAdmin).toBe(false);
    });
    expect(checkGlobalAdmin).toHaveBeenCalledTimes(1);
  });
});
