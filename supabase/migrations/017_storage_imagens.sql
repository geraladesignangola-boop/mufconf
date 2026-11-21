-- ==============================================================================
-- 017: BUCKET DE ARMAZENAMENTO DE IMAGENS (Supabase Storage)
-- ------------------------------------------------------------------------------
-- Cria o bucket público `wex-media`, usado pelo painel administrativo para
-- UPLOAD DIRECTO de imagens (galeria, logos de parceiros, cartaz oficial e
-- fotografias de oradoras), em substituição dos links externos/manuais.
--
-- Regras:
--   * Leitura pública (as imagens são servidas por URL pública no site).
--   * Escrita (insert/update/delete) apenas para utilizadores registados na
--     tabela `admins` (verifica o RLS do painel).
--   * Limite de 5 MB por ficheiro e tipos de imagem permitidos.
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wex-media',
  'wex-media',
  true,
  5242880, -- 5 MB
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml'
  ]
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ------------------------------------------------------------------------------
-- Políticas de acesso ao bucket
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Leitura pública de imagens wex-media" ON storage.objects;
CREATE POLICY "Leitura pública de imagens wex-media"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'wex-media');

DROP POLICY IF EXISTS "Admins carregam imagens wex-media" ON storage.objects;
CREATE POLICY "Admins carregam imagens wex-media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'wex-media'
    AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins substituem imagens wex-media" ON storage.objects;
CREATE POLICY "Admins substituem imagens wex-media"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'wex-media'
    AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'wex-media'
    AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins apagam imagens wex-media" ON storage.objects;
CREATE POLICY "Admins apagam imagens wex-media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wex-media'
    AND EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
