import { beforeEach, describe, expect, it, vi } from 'vitest';

const { rpcMock, getSessionMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  getSessionMock: vi.fn().mockResolvedValue({ data: { session: null } }),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    rpc: rpcMock,
    auth: {
      getSession: getSessionMock,
    },
  },
}));

import { getAllCompanies, isGlobalAdmin } from './globalAdminService';

describe('globalAdminService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('isGlobalAdmin retorna false quando rpc falha', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'erro' },
    });

    await expect(isGlobalAdmin()).resolves.toBe(false);
    expect(rpcMock).toHaveBeenCalledWith('is_global_admin');
  });

  it('getAllCompanies retorna lista de empresas', async () => {
    const companies = [{ company_id: 'c1', company_name: 'Empresa 1' }];
    rpcMock.mockResolvedValueOnce({
      data: companies,
      error: null,
    });

    await expect(getAllCompanies()).resolves.toEqual(companies);
    expect(rpcMock).toHaveBeenCalledWith('get_all_companies');
  });

  it('getAllCompanies lanca erro quando rpc retorna erro', async () => {
    rpcMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'Sem permissao' },
    });

    await expect(getAllCompanies()).rejects.toThrow('Sem permissao');
  });
});
