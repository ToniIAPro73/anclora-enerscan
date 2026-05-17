'use server';

import { AuthError } from 'next-auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createPasswordResetToken, hashPassword, hashToken } from '@/lib/password';
import { signIn, signOut as authSignOut } from '@/auth';

type AuthActionState = {
  ok?: boolean;
  error?: string;
  resetUrl?: string;
};

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === 'string' ? raw.trim() : '';
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function authErrorMessage(error: unknown) {
  if (error instanceof AuthError) {
    if (error.type === 'CredentialsSignin') return 'Email o contraseña incorrectos.';
    return 'No se pudo completar la autenticación.';
  }
  return error instanceof Error ? error.message : 'No se pudo completar la autenticación.';
}

export async function signInWithEmail(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(value(formData, 'email'));
  const password = value(formData, 'password');

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if ((error as Error & { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    return { error: authErrorMessage(error) };
  }

  return { ok: true };
}

export async function signUpWithEmail(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const name = value(formData, 'name');
  const email = normalizeEmail(value(formData, 'email'));
  const password = value(formData, 'password');

  if (!email || !password || password.length < 8) {
    return { error: 'Introduce un email válido y una contraseña de al menos 8 caracteres.' };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return { error: 'Ya existe una cuenta con ese email.' };

    await prisma.user.create({
      data: {
        name: name || email,
        email,
        passwordHash: await hashPassword(password),
      },
    });

    await signIn('credentials', {
      email,
      password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if ((error as Error & { digest?: string }).digest?.startsWith('NEXT_REDIRECT')) throw error;
    return { error: authErrorMessage(error) };
  }

  return { ok: true };
}

export async function requestPasswordReset(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const email = normalizeEmail(value(formData, 'email'));
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } });

  if (!user?.email) return { ok: true };

  const token = createPasswordResetToken();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.AUTH_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expires: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  if (process.env.PASSWORD_RESET_WEBHOOK_URL) {
    await fetch(process.env.PASSWORD_RESET_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email, resetUrl }),
    });
  } else if (process.env.NODE_ENV !== 'production') {
    console.info(`EnergyScan password reset URL for ${user.email}: ${resetUrl}`);
    return { ok: true, resetUrl };
  }

  return { ok: true };
}

export async function resetPassword(_: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const token = value(formData, 'token');
  const password = value(formData, 'password');
  if (!token || password.length < 8) return { error: 'El enlace no es válido o la contraseña es demasiado corta.' };

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { id: true, userId: true, expires: true, usedAt: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expires.getTime() < Date.now()) {
    return { error: 'El enlace de recuperación ha caducado o ya fue usado.' };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  redirect('/auth?reset=success');
}

export async function signInWithProvider(formData: FormData) {
  const provider = value(formData, 'provider');
  if (provider !== 'google' && provider !== 'github') redirect('/auth?error=invalid-provider');
  await signIn(provider, { redirectTo: '/dashboard' });
}

export async function signOut() {
  await authSignOut({ redirectTo: '/' });
}
