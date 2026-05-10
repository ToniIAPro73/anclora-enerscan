type OAuthProviderStatus = {
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
  missing: string[];
};

export function getOAuthEnv() {
  const googleClientId =
    process.env.AUTH_GOOGLE_ID ||
    process.env.AUTH_GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.GOOGLE_ID;
  const googleClientSecret =
    process.env.AUTH_GOOGLE_SECRET ||
    process.env.AUTH_GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_CLIENT_SECRET ||
    process.env.GOOGLE_SECRET;
  const githubClientId =
    process.env.AUTH_GITHUB_ID ||
    process.env.AUTH_GITHUB_CLIENT_ID ||
    process.env.GITHUB_CLIENT_ID ||
    process.env.GITHUB_ID;
  const githubClientSecret =
    process.env.AUTH_GITHUB_SECRET ||
    process.env.AUTH_GITHUB_CLIENT_SECRET ||
    process.env.GITHUB_CLIENT_SECRET ||
    process.env.GITHUB_SECRET;

  return {
    google: {
      enabled: Boolean(googleClientId && googleClientSecret),
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      missing: [
        !googleClientId ? 'AUTH_GOOGLE_ID or GOOGLE_CLIENT_ID' : null,
        !googleClientSecret ? 'AUTH_GOOGLE_SECRET or GOOGLE_CLIENT_SECRET' : null,
      ].filter(Boolean) as string[],
    },
    github: {
      enabled: Boolean(githubClientId && githubClientSecret),
      clientId: githubClientId,
      clientSecret: githubClientSecret,
      missing: [
        !githubClientId ? 'AUTH_GITHUB_ID or GITHUB_CLIENT_ID' : null,
        !githubClientSecret ? 'AUTH_GITHUB_SECRET or GITHUB_CLIENT_SECRET' : null,
      ].filter(Boolean) as string[],
    },
  } satisfies Record<'google' | 'github', OAuthProviderStatus>;
}
