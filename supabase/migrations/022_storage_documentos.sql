-- ==============================================================================
-- 022: BUCKET wex-media PASSA A ACEITAR DOCUMENTOS (Materiais & Atalhos)
-- ------------------------------------------------------------------------------
-- A secção "Materiais & Atalhos" do site público permite descarregar documentos
-- (PDF, Word, Excel, PowerPoint, ZIP, TXT). O bucket `wex-media` é alargado
-- para aceitar esses tipos e subir o limite por ficheiro para 20 MB.
-- As políticas de acesso (leitura pública, escrita só para admins) mantêm-se.
-- ==============================================================================

UPDATE storage.buckets
SET
  file_size_limit = 20971520, -- 20 MB
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'text/plain'
  ]
WHERE id = 'wex-media';
