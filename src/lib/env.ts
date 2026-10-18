export const env = {
  clerkKey: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '',
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8787').replace(/\/$/, ''),
  githubRepo: process.env.EXPO_PUBLIC_GITHUB_REPO ?? 'luiscruzga/lukita',
  vapidPublicKey: process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  siteUrl: process.env.EXPO_PUBLIC_SITE_URL ?? '',
};
