/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_LINKEDIN_CLIENT_ID: string;
  readonly VITE_TWITTER_CLIENT_ID: string;
  readonly VITE_INSTAGRAM_CLIENT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
