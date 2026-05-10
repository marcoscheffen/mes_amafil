
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const maskPhone = (v: string): string => {
  const d = v.replace(/\D/g, '').slice(0, 13);
  if (!d.length) return '';
  if (d.length <= 2)  return `+${d}`;
  if (d.length <= 4)  return `+${d.slice(0, 2)} (${d.slice(2)}`;
  if (d.length <= 8)  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4)}`;
  if (d.length <= 12) return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 8)}-${d.slice(8)}`;
  return `+${d.slice(0, 2)} (${d.slice(2, 4)}) ${d.slice(4, 9)}-${d.slice(9)}`;
};

/** Logo login — bucket público Supabase PROD (`Logo/Ayvi_Logo_120.png`) */
const AYVI_LOGIN_LOGO_URL =
  'https://tfkvgkkqpmafvczodnco.supabase.co/storage/v1/object/public/Logo/Ayvi_Logo_120.png';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register — required
  const [companyName, setCompanyName] = useState('');
  const [companySlug, setCompanySlug] = useState('');

  // Register — optional (owner profile + company details)
  const [regFullName, setRegFullName] = useState('');
  const [regTradeName, setRegTradeName] = useState('');
  const [regCnpj, setRegCnpj] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regContactEmail, setRegContactEmail] = useState('');
  const [regCity, setRegCity] = useState('');
  const [regState, setRegState] = useState('');
  const [regZipCode, setRegZipCode] = useState('');
  const [regStreet, setRegStreet] = useState('');
  const [regStreetNumber, setRegStreetNumber] = useState('');
  const [regNeighborhood, setRegNeighborhood] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rhdokmwoprfpjhjikpnf.supabase.co';
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoZG9rbXdvcHJmcGpoamlrcG5mIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjcxMDIsImV4cCI6MjA4ODQwMzEwMn0._ve33xAOJ-8_VwYGavSBkBxpd74046FFILNBfpaz2zU';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError(signInError.message || 'Erro ao fazer login');
        return;
      }

      if (data?.user) {
        onLogin(data.user.email || email);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validações básicas
      if (!email || !password || !companyName || !companySlug) {
        setError('Email, senha, nome da empresa e slug são obrigatórios');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('A senha deve ter no mínimo 6 caracteres');
        setLoading(false);
        return;
      }

      if (!/^[a-z0-9-]+$/.test(companySlug)) {
        setError('O slug deve conter apenas letras minúsculas, números e hífens');
        setLoading(false);
        return;
      }

      // Montar payload — campos opcionais só incluídos se preenchidos
      const payload: Record<string, any> = {
        email,
        password,
        company_name: companyName,
        company_slug: companySlug,
      };

      if (regFullName.trim()) payload.full_name = regFullName.trim();
      if (regTradeName.trim()) payload.trade_name = regTradeName.trim();
      if (regCnpj.trim()) payload.cnpj = regCnpj.trim();
      if (regPhone.trim()) payload.phone_primary = regPhone.replace(/\D/g, '');
      if (regContactEmail.trim()) payload.contact_email = regContactEmail.trim();
      if (regCity.trim()) payload.city = regCity.trim();
      if (regState.trim()) payload.state = regState.trim();
      if (regZipCode.trim()) payload.zip_code = regZipCode.trim();
      if (regStreet.trim()) payload.street = regStreet.trim();
      if (regStreetNumber.trim()) payload.street_number = regStreetNumber.trim();
      if (regNeighborhood.trim()) payload.neighborhood = regNeighborhood.trim();

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/register-company`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao cadastrar empresa');
      }

      // Login automático após cadastro
      const { data: signInData, error: signInError } = await signIn(email, password);

      if (signInError) {
        setError('Empresa criada, mas erro ao fazer login. Tente fazer login manualmente.');
        setIsRegisterMode(false);
        setLoading(false);
        return;
      }

      if (signInData?.user) {
        onLogin(signInData.user.email || email);
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar empresa');
      setLoading(false);
    }
  };

  const handleSlugChange = (value: string) => {
    setCompanySlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const resetRegisterFields = () => {
    setCompanyName('');
    setCompanySlug('');
    setRegFullName('');
    setRegTradeName('');
    setRegCnpj('');
    setRegPhone('');
    setRegContactEmail('');
    setRegCity('');
    setRegState('');
    setRegZipCode('');
    setRegStreet('');
    setRegStreetNumber('');
    setRegNeighborhood('');
    setShowOptionalFields(false);
  };

  const inputClass =
    'w-full h-12 bg-slate-900 border border-slate-700 rounded-xl px-4 text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  const labelClass = 'text-sm font-semibold text-slate-300';

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-500/10 rounded-full blur-[120px]" />
      </div>

      <div className={`relative z-10 w-full flex flex-col gap-8 ${isRegisterMode ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="flex flex-col items-center text-center mb-6">
          <img
            src={AYVI_LOGIN_LOGO_URL}
            alt="Ayvi"
            className="h-[72px] sm:h-[90px] w-auto max-w-[min(100%,360px)] object-contain object-center"
            width={360}
            height={90}
            decoding="async"
            fetchPriority="high"
          />
        </div>

        <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl">
          <div className="mb-6">
            {isRegisterMode && (
              <h2 className="text-xl font-bold text-white mb-1">
                Criar nova empresa
              </h2>
            )}
            <p className="text-sm text-slate-400">
              {isRegisterMode
                ? 'Preencha os dados para criar sua empresa.'
                : 'Entre com sua conta para continuar.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <form
            className="space-y-5"
            onSubmit={isRegisterMode ? handleRegister : handleSubmit}
          >
            {/* ─── Credenciais ─── */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className={labelClass}>E-mail *</label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className={inputClass}
                    placeholder="digite seu e-mail"
                    required
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-slate-600">mail</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className={labelClass}>Senha *</label>
                  {!isRegisterMode && (
                    <button type="button" className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors">
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className={inputClass}
                    placeholder="digite sua senha"
                    required
                    minLength={6}
                  />
                  <span className="material-symbols-outlined absolute right-3 top-3 text-slate-600">visibility</span>
                </div>
                {isRegisterMode && (
                  <p className="text-xs text-slate-500">Mínimo de 6 caracteres</p>
                )}
              </div>
            </div>

            {/* ─── Campos de Cadastro ─── */}
            {isRegisterMode && (
              <>
                {/* Empresa (obrigatório) */}
                <div className="border-t border-slate-700 pt-4">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Empresa</p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label className={labelClass}>Nome da Empresa *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          disabled={loading}
                          className={inputClass}
                          placeholder="Ex: Minha Empresa"
                          required
                        />
                        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-600">business</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className={labelClass}>Slug *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={companySlug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          disabled={loading}
                          className={inputClass}
                          placeholder="minha-empresa"
                          required
                        />
                        <span className="material-symbols-outlined absolute right-3 top-3 text-slate-600">link</span>
                      </div>
                      <p className="text-xs text-slate-500">Letras minúsculas, números e hífens</p>
                    </div>
                  </div>
                </div>

                {/* Toggle campos opcionais */}
                <button
                  type="button"
                  onClick={() => setShowOptionalFields((v) => !v)}
                  className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  <span className="material-symbols-outlined text-base">
                    {showOptionalFields ? 'expand_less' : 'expand_more'}
                  </span>
                  {showOptionalFields ? 'Ocultar campos opcionais' : 'Preencher mais informações (opcional)'}
                </button>

                {showOptionalFields && (
                  <>
                    {/* Responsável */}
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Responsável</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className={labelClass}>Nome Completo</label>
                          <input
                            type="text"
                            value={regFullName}
                            onChange={(e) => setRegFullName(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="João da Silva"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Telefone</label>
                          <input
                            type="tel"
                            value={regPhone}
                            onChange={(e) => setRegPhone(maskPhone(e.target.value))}
                            disabled={loading}
                            className={inputClass}
                            placeholder="+55 (45) 8823-0654"
                            maxLength={20}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dados da empresa */}
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Dados da Empresa</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <label className={labelClass}>Nome Fantasia</label>
                          <input
                            type="text"
                            value={regTradeName}
                            onChange={(e) => setRegTradeName(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="Nome Fantasia"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>CNPJ</label>
                          <input
                            type="text"
                            value={regCnpj}
                            onChange={(e) => setRegCnpj(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="00.000.000/0001-00"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>E-mail de Contato</label>
                          <input
                            type="email"
                            value={regContactEmail}
                            onChange={(e) => setRegContactEmail(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="contato@empresa.com"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Endereço */}
                    <div className="border-t border-slate-700 pt-4">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Endereço</p>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="space-y-2 sm:col-span-2">
                          <label className={labelClass}>Logradouro</label>
                          <input
                            type="text"
                            value={regStreet}
                            onChange={(e) => setRegStreet(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="Rua / Av."
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Número</label>
                          <input
                            type="text"
                            value={regStreetNumber}
                            onChange={(e) => setRegStreetNumber(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="123"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Bairro</label>
                          <input
                            type="text"
                            value={regNeighborhood}
                            onChange={(e) => setRegNeighborhood(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="Bairro"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>CEP</label>
                          <input
                            type="text"
                            value={regZipCode}
                            onChange={(e) => setRegZipCode(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="00000-000"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Cidade</label>
                          <input
                            type="text"
                            value={regCity}
                            onChange={(e) => setRegCity(e.target.value)}
                            disabled={loading}
                            className={inputClass}
                            placeholder="São Paulo"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className={labelClass}>Estado (UF)</label>
                          <input
                            type="text"
                            value={regState}
                            onChange={(e) => setRegState(e.target.value.toUpperCase().slice(0, 2))}
                            disabled={loading}
                            className={inputClass}
                            placeholder="SP"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>{isRegisterMode ? 'Criando empresa...' : 'Entrando...'}</span>
                </>
              ) : (
                <>
                  <span>{isRegisterMode ? 'Criar empresa' : 'Entrar na plataforma'}</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            {isRegisterMode && (
              <p className="text-sm text-slate-400">
                Já tem uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setError(null);
                    resetRegisterFields();
                  }}
                  className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400 font-bold hover:opacity-80 transition-opacity"
                >
                  Fazer login
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
