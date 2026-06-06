import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const DOCUMENTS_BUCKET = 'caresync-documents';

// Lazily create the Supabase client. Creating it eagerly with empty
// credentials throws ("supabaseUrl is required"), which would crash the API
// on startup whenever document storage isn't configured. Instead we build it
// on first use and surface a clean error if the env vars are missing.
let _client: ReturnType<typeof createClient> | null = null;

function getClient() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw ApiError.internal(
      'Document storage is not configured (set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)',
      'STORAGE_NOT_CONFIGURED'
    );
  }
  if (!_client) {
    _client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  }
  return _client;
}

export const storageService = {
  isConfigured(): boolean {
    return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
  },

  async ensureBucketExists() {
    const supabase = getClient();
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some((b) => b.name === DOCUMENTS_BUCKET);
    if (!exists) {
      await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'image/gif',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ],
      });
    }
  },

  async getSignedUrl(filePath: string, expiresInSeconds = 3600): Promise<string> {
    const { data, error } = await getClient()
      .storage.from(DOCUMENTS_BUCKET)
      .createSignedUrl(filePath, expiresInSeconds);
    if (error || !data) throw ApiError.internal('Failed to generate download URL', 'STORAGE_ERROR');
    return data.signedUrl;
  },

  async deleteFile(filePath: string): Promise<void> {
    const { error } = await getClient().storage.from(DOCUMENTS_BUCKET).remove([filePath]);
    if (error) throw ApiError.internal('Failed to delete file', 'STORAGE_ERROR');
  },

  async getUploadSignedUrl(filePath: string): Promise<string> {
    const { data, error } = await getClient()
      .storage.from(DOCUMENTS_BUCKET)
      .createSignedUploadUrl(filePath);
    if (error || !data) throw ApiError.internal('Failed to generate upload URL', 'STORAGE_ERROR');
    return data.signedUrl;
  },
};
