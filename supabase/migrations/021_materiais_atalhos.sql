-- ==============================================================================
-- 021. TABELA DE MATERIAIS & ATALHOS (secção pública "Materiais & Atalhos")
-- ==============================================================================
-- A secção "Materiais & Atalhos" do site público (ModernaLogisticaInscricao)
-- passa a ser gerida pelo painel admin: documentos para descarregar
-- (tipo = 'material') e ligações externas (tipo = 'atalho').

CREATE TABLE IF NOT EXISTS public.materiais_atalhos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'atalho' CHECK (tipo IN ('material', 'atalho')),
  titulo TEXT NOT NULL,
  descricao TEXT,
  url TEXT NOT NULL,
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.materiais_atalhos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'atalho';
ALTER TABLE public.materiais_atalhos ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.materiais_atalhos ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.materiais_atalhos ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.materiais_atalhos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de materiais e atalhos" ON public.materiais_atalhos;
CREATE POLICY "Leitura pública de materiais e atalhos"
  ON public.materiais_atalhos FOR SELECT
  TO anon, authenticated
  USING (visivel = true);

DROP POLICY IF EXISTS "Admins podem gerir materiais e atalhos" ON public.materiais_atalhos;
CREATE POLICY "Admins podem gerir materiais e atalhos"
  ON public.materiais_atalhos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );
