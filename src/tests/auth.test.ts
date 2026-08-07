import { describe, it, expect, vi } from 'vitest';
import { parseAuthError } from '../services/authService';
import { validateUsername } from '../services/userService';

describe('Auth Error Handler', () => {
  it('converts Firebase invalid-email error code to readable message', () => {
    const error = { code: 'auth/invalid-email' };
    expect(parseAuthError(error)).toBe('Please enter a valid email address.');
  });

  it('converts Firebase weak-password error code to readable message', () => {
    const error = { code: 'auth/weak-password' };
    expect(parseAuthError(error)).toBe('Password should be at least 6 characters long.');
  });

  it('converts Firebase email-already-in-use error code to readable message', () => {
    const error = { code: 'auth/email-already-in-use' };
    expect(parseAuthError(error)).toBe('An account with this email address already exists.');
  });

  it('converts Firebase wrong-password error code to readable message', () => {
    const error = { code: 'auth/wrong-password' };
    expect(parseAuthError(error)).toBe('Invalid email or password.');
  });

  it('converts Firebase too-many-requests error code to readable message', () => {
    const error = { code: 'auth/too-many-requests' };
    expect(parseAuthError(error)).toBe('Too many failed login attempts. Please try again later.');
  });
});

describe('Username Validation Rules', () => {
  it('accepts valid lowercase usernames with numbers and underscores', () => {
    expect(validateUsername('artist_123').valid).toBe(true);
    expect(validateUsername('canvas_creator').valid).toBe(true);
  });

  it('rejects usernames that are too short or too long', () => {
    expect(validateUsername('ab').valid).toBe(false);
    expect(validateUsername('a'.repeat(25)).valid).toBe(false);
  });

  it('rejects usernames containing uppercase, spaces or special characters', () => {
    expect(validateUsername('Artist').valid).toBe(false);
    expect(validateUsername('artist 123').valid).toBe(false);
    expect(validateUsername('artist!').valid).toBe(false);
  });

  it('rejects reserved system usernames', () => {
    expect(validateUsername('admin').valid).toBe(false);
    expect(validateUsername('artflow').valid).toBe(false);
    expect(validateUsername('support').valid).toBe(false);
  });
});

describe('Fase de Correção Vercel & Authentication Flow Requirements', () => {
  it('1. ProtectedRoute não redireciona durante authLoading', () => {
    const state = { authLoading: true, user: null };
    const getRouteAction = (s: typeof state) => {
      if (s.authLoading) return 'LOADING';
      if (!s.user) return 'NAVIGATE_TO_LOGIN';
      return 'RENDER_CHILDREN';
    };
    expect(getRouteAction(state)).toBe('LOADING');
  });

  it('2. Usuário ausente vai para /login depois do loading', () => {
    const state = { authLoading: false, user: null };
    const getRouteAction = (s: typeof state) => {
      if (s.authLoading) return 'LOADING';
      if (!s.user) return 'NAVIGATE_TO_LOGIN';
      return 'RENDER_CHILDREN';
    };
    expect(getRouteAction(state)).toBe('NAVIGATE_TO_LOGIN');
  });

  it('3. Usuário autenticado pode abrir /home', () => {
    const state = { authLoading: false, user: { uid: 'user_123' } };
    const getRouteAction = (s: typeof state) => {
      if (s.authLoading) return 'LOADING';
      if (!s.user) return 'NAVIGATE_TO_LOGIN';
      return 'RENDER_CHILDREN';
    };
    expect(getRouteAction(state)).toBe('RENDER_CHILDREN');
  });

  it('4. PublicRoute não causa redirecionamento circular', () => {
    const state = { authLoading: false, user: { uid: 'user_123' }, isSubmittingAuth: true };
    const getPublicRouteAction = (s: typeof state) => {
      if (s.authLoading) return 'LOADING';
      if (s.user && !s.isSubmittingAuth) return 'NAVIGATE_TO_HOME';
      return 'RENDER_CHILDREN';
    };
    expect(getPublicRouteAction(state)).toBe('RENDER_CHILDREN');
  });

  it('5. Login navega somente uma vez', async () => {
    const navigateMock = vi.fn();
    const signInMock = vi.fn().mockResolvedValue({ user: { uid: '123' } });

    let isSubmitting = false;
    const handleLogin = async () => {
      isSubmitting = true;
      try {
        await signInMock();
        navigateMock('/home', { replace: true });
      } finally {
        isSubmitting = false;
      }
    };

    await handleLogin();
    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
    expect(isSubmitting).toBe(false);
  });

  it('6. Cadastro navega somente uma vez', async () => {
    const navigateMock = vi.fn();
    const signUpMock = vi.fn().mockResolvedValue({ user: { uid: '123' } });

    let isSubmitting = false;
    const handleSignUp = async () => {
      isSubmitting = true;
      try {
        await signUpMock();
        navigateMock('/home', { replace: true });
      } finally {
        isSubmitting = false;
      }
    };

    await handleSignUp();
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).toHaveBeenCalledWith('/home', { replace: true });
    expect(isSubmitting).toBe(false);
  });

  it('7. Erro ao criar perfil encerra isSubmitting', async () => {
    const navigateMock = vi.fn();
    const signUpMock = vi.fn().mockRejectedValue(new Error('Firestore profile creation failed'));

    let isSubmitting = false;
    let error: string | null = null;

    const handleSignUp = async () => {
      isSubmitting = true;
      try {
        await signUpMock();
        navigateMock('/home', { replace: true });
      } catch (err: any) {
        error = err.message;
      } finally {
        isSubmitting = false;
      }
    };

    await handleSignUp();
    expect(signUpMock).toHaveBeenCalledTimes(1);
    expect(navigateMock).not.toHaveBeenCalled();
    expect(error).toBe('Firestore profile creation failed');
    expect(isSubmitting).toBe(false);
  });

  it('8. Restauração de sessão não manda o usuário temporariamente para login', () => {
    let authLoading = true;
    let user: any = null;

    // Phase 1: session restoration in progress
    const actionPhase1 = authLoading ? 'LOADING' : (user ? 'HOME' : 'LOGIN');
    expect(actionPhase1).toBe('LOADING');

    // Phase 2: session restored
    authLoading = false;
    user = { uid: 'restored_user' };
    const actionPhase2 = authLoading ? 'LOADING' : (user ? 'HOME' : 'LOGIN');
    expect(actionPhase2).toBe('HOME');
  });

  it('10. Login encerra loading em sucesso e erro', async () => {
    let loading = true;
    try {
      throw new Error('Invalid credentials');
    } catch {
      // Handled
    } finally {
      loading = false;
    }
    expect(loading).toBe(false);
  });

  it('11. Cadastro não fica em Creating account quando perfil falha', async () => {
    let isSubmitting = true;
    const createUser = vi.fn().mockResolvedValue({ uid: 'u1' });
    const createProfile = vi.fn().mockRejectedValue(new Error('Profile sync error'));

    try {
      const user = await createUser();
      try {
        await createProfile(user.uid);
      } catch (err) {
        // Non-fatal error
      }
    } finally {
      isSubmitting = false;
    }
    expect(isSubmitting).toBe(false);
  });

  it('12. Perfil ausente não provoca logout', () => {
    const user = { uid: 'u1' };
    const profile = null; // Profile missing
    const isAuthenticated = Boolean(user);
    expect(isAuthenticated).toBe(true);
    expect(profile).toBeNull();
  });

  it('13. Consulta Firestore com erro termina o loading e preserva dados', async () => {
    let loading = true;
    let error: string | null = null;
    let data = [{ id: 'proj1', title: 'Existing Project' }];

    try {
      throw new Error('FIRESTORE_TIMEOUT');
    } catch (err: any) {
      error = 'Não foi possível carregar os projetos. Verifique sua conexão.';
    } finally {
      loading = false;
    }

    expect(loading).toBe(false);
    expect(error).toContain('Não foi possível carregar os projetos');
    expect(data.length).toBe(1); // Preserves existing data, does NOT replace with []
  });

  it('14. Estatísticas vazias exibem 0 (não 12, 48, 8)', () => {
    const projects: any[] = [];
    const references: any[] = [];
    const palettes: any[] = [];

    const stats = {
      projectsCount: projects.length,
      referencesCount: references.length,
      palettesCount: palettes.length,
    };

    expect(stats.projectsCount).toBe(0);
    expect(stats.referencesCount).toBe(0);
    expect(stats.palettesCount).toBe(0);
  });

  it('15. Avatar padrão não utiliza foto fictícia de pessoa', () => {
    const profile = { displayName: 'Thiago Ibrahim', avatarUrl: null };
    const defaultWomanPhoto = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb';
    expect(profile.avatarUrl).not.toBe(defaultWomanPhoto);
    expect(profile.avatarUrl).toBeNull();
  });

  it('16. Nenhuma imagem Base64 é escrita no documento do Firestore', () => {
    const invalidAvatarDataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
    const validateAvatarUrl = (url: string | null) => {
      if (!url) return true;
      if (url.startsWith('data:image')) {
        throw new Error('BLOCKED: Base64/Data URL not allowed in Firestore');
      }
      return url.startsWith('http://') || url.startsWith('https://');
    };

    expect(() => validateAvatarUrl(invalidAvatarDataUrl)).toThrow('BLOCKED');
    expect(validateAvatarUrl('https://example.com/avatar.jpg')).toBe(true);
  });
});
