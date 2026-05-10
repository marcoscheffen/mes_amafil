import React, { useState, useEffect } from 'react';
import { useCompany } from '../../contexts/CompanyContext';
import { followupService } from '../../services/followupService';

interface Props {
  canManage: boolean;
}

export const WhatsappCredentialsTab: React.FC<Props> = ({ canManage }) => {
  const { currentCompany } = useCompany();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'fail' | null>(null);

  const [instanceUrl, setInstanceUrl] = useState('');
  const [token, setToken] = useState('');
  const [hasToken, setHasToken] = useState(false);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!currentCompany) return;
    setLoading(true);
    followupService.getMessagingCredentials(currentCompany.id)
      .then(creds => {
        if (creds) {
           setInstanceUrl(creds.instance_url || '');
           setHasToken(!!creds.id); // If we have a record, there's a token stored
           setIsActive(!!creds.is_active);
        }
      })
      .catch(err => {
        // Just empty if none exists
      })
      .finally(() => setLoading(false));
  }, [currentCompany]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompany) return;
    if (!instanceUrl.trim() || (!hasToken && !token.trim())) {
       setError('Preencha a URL e o Token.');
       return;
    }
    setSaving(true);
    setError(null);
    setTestResult(null);
    try {
      const trimmedToken = token.trim();
      if (trimmedToken) {
        await followupService.upsertMessagingCredentials({
          companyId: currentCompany.id,
          provider: 'uazapi',
          instanceUrl: instanceUrl.trim(),
          token: trimmedToken,
        });
        setHasToken(true);
        setToken('');
      } else {
        await followupService.updateMessagingInstance({
          companyId: currentCompany.id,
          provider: 'uazapi',
          instanceUrl: instanceUrl.trim(),
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar credenciais WhatsApp');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      // Pass the new token if typed, else we can't fully test client-side without a backend proxy that uses the vault token.
      // We will perform the test only if the user provides the token right now, or warn them.
      if (!token) {
         setError('Para testar a conexão diretamente pelo painel, insira o Token temporalmente e salve, ou digite-o no campo.');
         setTesting(false);
         return;
      }
      const ok = await followupService.testCredentials(instanceUrl, token);
      setTestResult(ok ? 'success' : 'fail');
    } catch (err) {
      setTestResult('fail');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return null;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden mt-8">
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Uazapi" className="w-8 h-8 opacity-80" />
          <div>
            <h3 className="text-xl font-bold text-white">Credenciais WhatsApp (Uazapi)</h3>
            <p className="text-sm text-slate-400">Integração do disparo de IA via WhatsApp Uazapi para Lembretes.</p>
          </div>
        </div>

        {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}

        <div className="border border-slate-700 rounded-xl p-5 space-y-4">
           <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Instance URL (Uazapi)</label>
                  <input
                    type="url"
                    disabled={!canManage}
                    value={instanceUrl}
                    onChange={(e) => setInstanceUrl(e.target.value)}
                    placeholder="https://sua-instancia-uazapi.com.br"
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">URL base da API (sem a barra no final)</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Apikey (Token)</label>
                  <input
                    type="password"
                    disabled={!canManage}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder={hasToken ? '•••••••• (salvo no Cofre)' : 'Token Global ou Instance Token'}
                    className="w-full h-10 bg-slate-900 border border-slate-700 rounded-xl px-3 text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Este token é salvo criptografado no Supabase Vault.</p>
                </div>
              </div>

              {canManage && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
                  <div className="flex gap-2">
                     <button
                       type="submit"
                       disabled={saving}
                       className="h-9 px-5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40"
                     >
                       {saving ? 'Salvando...' : 'Salvar Credenciais'}
                     </button>
                     <button
                       type="button"
                       onClick={handleTest}
                       disabled={testing || !instanceUrl}
                       className="h-9 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40"
                     >
                       {testing ? 'Testando...' : 'Testar Conexão'}
                     </button>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {saved && <span className="text-emerald-400 animate-in fade-in">✓ Salvo com sucesso!</span>}
                    {testResult === 'success' && <span className="text-emerald-400">Conexão OK!</span>}
                    {testResult === 'fail' && <span className="text-red-400">Falha ao testar. Verifique URL/Token.</span>}
                  </div>
                </div>
              )}
           </form>
        </div>
      </div>
    </div>
  );
};
