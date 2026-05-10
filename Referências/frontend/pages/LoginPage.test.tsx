import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { useAuth } from '../hooks/useAuth';

vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza a tela de login', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any);

    render(<LoginPage onLogin={vi.fn()} />);

    expect(screen.getByRole('img', { name: /ayvi/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /entrar na plataforma/i })).toBeTruthy();
  });

  it('faz login e chama callback onLogin no sucesso', async () => {
    const signInMock = vi.fn().mockResolvedValue({
      data: { user: { email: 'user@example.com' } },
      error: null,
    });

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: signInMock,
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any);

    const onLogin = vi.fn();
    render(<LoginPage onLogin={onLogin} />);

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secure123' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith('user@example.com', 'secure123');
    });
    expect(onLogin).toHaveBeenCalledWith('user@example.com');
  });

  it('exibe mensagem de erro quando login falha', async () => {
    const signInMock = vi.fn().mockRejectedValue(new Error('Credenciais invalidas'));

    vi.mocked(useAuth).mockReturnValue({
      user: null,
      session: null,
      loading: false,
      error: null,
      signIn: signInMock,
      signOut: vi.fn(),
      signUp: vi.fn(),
    } as any);

    render(<LoginPage onLogin={vi.fn()} />);

    const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar na plataforma/i }));

    await waitFor(() => {
      expect(screen.getByText('Credenciais invalidas')).toBeTruthy();
    });
  });
});
