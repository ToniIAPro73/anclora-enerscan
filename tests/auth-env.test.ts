import { getOAuthEnv } from '@/lib/auth-env';

describe('getOAuthEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Clear relevant env vars
    delete process.env.AUTH_GOOGLE_ID;
    delete process.env.AUTH_GOOGLE_SECRET;
    delete process.env.AUTH_GOOGLE_CLIENT_ID;
    delete process.env.AUTH_GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_ID;
    delete process.env.GOOGLE_SECRET;
    delete process.env.AUTH_GITHUB_ID;
    delete process.env.AUTH_GITHUB_SECRET;
    delete process.env.AUTH_GITHUB_CLIENT_ID;
    delete process.env.AUTH_GITHUB_CLIENT_SECRET;
    delete process.env.GITHUB_CLIENT_ID;
    delete process.env.GITHUB_CLIENT_SECRET;
    delete process.env.GITHUB_ID;
    delete process.env.GITHUB_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return disabled if no variables are set', () => {
    const oauth = getOAuthEnv();
    expect(oauth.google.enabled).toBe(false);
    expect(oauth.github.enabled).toBe(false);
    expect(oauth.google.missing).toContain('AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID');
    expect(oauth.google.missing).toContain('AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET');
  });

  it('should enable Google if AUTH_GOOGLE_* vars are set', () => {
    process.env.AUTH_GOOGLE_ID = 'google-id';
    process.env.AUTH_GOOGLE_SECRET = 'google-secret';
    const oauth = getOAuthEnv();
    expect(oauth.google.enabled).toBe(true);
    expect(oauth.google.clientId).toBe('google-id');
    expect(oauth.google.clientSecret).toBe('google-secret');
    expect(oauth.google.missing).toHaveLength(0);
  });

  it('should enable Google if GOOGLE_CLIENT_* aliases are set', () => {
    process.env.GOOGLE_CLIENT_ID = 'google-id-alias';
    process.env.GOOGLE_CLIENT_SECRET = 'google-secret-alias';
    const oauth = getOAuthEnv();
    expect(oauth.google.enabled).toBe(true);
    expect(oauth.google.clientId).toBe('google-id-alias');
    expect(oauth.google.clientSecret).toBe('google-secret-alias');
  });

  it('should enable Google if AUTH_GOOGLE_CLIENT_* aliases are set', () => {
    process.env.AUTH_GOOGLE_CLIENT_ID = 'google-id-client-alias';
    process.env.AUTH_GOOGLE_CLIENT_SECRET = 'google-secret-client-alias';
    const oauth = getOAuthEnv();
    expect(oauth.google.enabled).toBe(true);
    expect(oauth.google.clientId).toBe('google-id-client-alias');
    expect(oauth.google.clientSecret).toBe('google-secret-client-alias');
  });

  it('should enable GitHub if AUTH_GITHUB_* vars are set', () => {
    process.env.AUTH_GITHUB_ID = 'github-id';
    process.env.AUTH_GITHUB_SECRET = 'github-secret';
    const oauth = getOAuthEnv();
    expect(oauth.github.enabled).toBe(true);
    expect(oauth.github.clientId).toBe('github-id');
    expect(oauth.github.clientSecret).toBe('github-secret');
  });

  it('should enable GitHub if GITHUB_* aliases are set', () => {
    process.env.GITHUB_ID = 'github-id-short';
    process.env.GITHUB_SECRET = 'github-secret-short';
    const oauth = getOAuthEnv();
    expect(oauth.github.enabled).toBe(true);
    expect(oauth.github.clientId).toBe('github-id-short');
    expect(oauth.github.clientSecret).toBe('github-secret-short');
  });

  it('should report missing secret if only ID is set', () => {
    process.env.AUTH_GOOGLE_ID = 'google-id';
    const oauth = getOAuthEnv();
    expect(oauth.google.enabled).toBe(false);
    expect(oauth.google.missing).toEqual(['AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET']);
  });
});
