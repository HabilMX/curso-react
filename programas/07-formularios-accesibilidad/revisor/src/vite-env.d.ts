interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_CADA_MS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
