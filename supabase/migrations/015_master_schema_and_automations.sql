-- ==============================================================================
-- MIGRAÇÃO MESTRE: CONFERÊNCIA MULHERES DE FOGO 2026 (WEX)
-- Ficheiro: 015_master_schema_and_automations.sql
-- Descrição: Tabelas completas com migração incremental (ALTER TABLE ... ADD COLUMN IF NOT EXISTS),
--            RLS seguro, Procedimentos Armazenados (RPCs), Triggers e Sementes.
-- ==============================================================================

-- 1. EXTENSÕES DO POSTGRESQL
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS unaccent WITH SCHEMA extensions;

-- ==============================================================================
-- 2. FUNÇÃO AUXILIAR: NORMALIZADOR DE TELEFONE (+244)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone TEXT)
RETURNS TEXT LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  clean TEXT;
BEGIN
  clean := regexp_replace(COALESCE(p_phone, ''), '\D', '', 'g');
  IF clean LIKE '244%' THEN
    RETURN '+' || clean;
  ELSIF length(clean) = 9 THEN
    RETURN '+244' || clean;
  ELSE
    RETURN '+' || clean;
  END IF;
END;
$$;

-- ==============================================================================
-- 3. TABELA DE CONFIGURAÇÕES GERAIS (Chave-Valor)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS value TEXT;
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Qualquer pessoa pode ler configurações ativas" ON public.app_settings;
CREATE POLICY "Qualquer pessoa pode ler configurações ativas"
  ON public.app_settings FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Apenas admins podem modificar configurações" ON public.app_settings;
CREATE POLICY "Apenas admins podem modificar configurações"
  ON public.app_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins WHERE id = auth.uid()
    )
  );

-- ==============================================================================
-- 4. TABELA DE UTILIZADORES ADMINISTRATIVOS & PERFIS RBAC
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir que colunas adicionadas nesta versão existam mesmo se a tabela já foi criada antes
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS telefone TEXT;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS papel TEXT DEFAULT 'desenvolvedor';
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMPTZ;
ALTER TABLE public.admins ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- 1. Qualquer utilizador autenticado pode consultar o seu próprio perfil ou a lista de staff
DROP POLICY IF EXISTS "Admins read own row" ON public.admins;
DROP POLICY IF EXISTS "Super admins gerem todos admins" ON public.admins;
DROP POLICY IF EXISTS "Admins read access" ON public.admins;

CREATE POLICY "Admins read access"
  ON public.admins FOR SELECT
  TO authenticated
  USING (true);

-- 2. Função SECURITY DEFINER para verificar super_admin sem recursão
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid() AND (role = 'super_admin' OR COALESCE(papel, 'desenvolvedor') = 'desenvolvedor')
  );
$$;

-- 3. Modificações na tabela admins por super_admins ou auto-registo
DROP POLICY IF EXISTS "Super admins manage admins" ON public.admins;
CREATE POLICY "Super admins manage admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "Super admins update admins" ON public.admins;
CREATE POLICY "Super admins update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.is_super_admin() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

DROP POLICY IF EXISTS "Super admins delete admins" ON public.admins;
CREATE POLICY "Super admins delete admins"
  ON public.admins FOR DELETE
  TO authenticated
  USING (public.is_super_admin());

-- ==============================================================================
-- 5. TABELA DE EVENTOS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT 'Conferência Mulheres de Fogo 2026',
  subtitulo TEXT DEFAULT 'Desperte a sua essência, viva o seu propósito.',
  data_evento DATE DEFAULT '2026-12-05',
  hora_inicio TEXT DEFAULT '08h00',
  hora_fim TEXT DEFAULT '20h00',
  local_nome TEXT DEFAULT 'Centro de Convenções Talatona',
  local_endereco TEXT DEFAULT 'Via A1, Talatona, Luanda, Angola',
  local_mapa_url TEXT DEFAULT 'https://maps.google.com/?q=Centro+de+Convencoes+Talatona+Luanda',
  vagas_total INTEGER NOT NULL DEFAULT 350,
  inscricoes_abertas BOOLEAN NOT NULL DEFAULT true,
  data_limite_inscricao TIMESTAMPTZ,
  inscricao_paga BOOLEAN NOT NULL DEFAULT false,
  valor NUMERIC(10,2) DEFAULT 0.00,
  instrucoes_pagamento TEXT,
  link_grupo_whatsapp TEXT DEFAULT 'https://chat.whatsapp.com/ExemploMulheresDeFogo2026',
  checkin_aberto BOOLEAN NOT NULL DEFAULT false,
  walkin_permitido BOOLEAN NOT NULL DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS titulo TEXT DEFAULT 'Conferência Mulheres de Fogo 2026';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS subtitulo TEXT;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS data_evento DATE DEFAULT '2026-12-05';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS hora_inicio TEXT DEFAULT '08h00';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS hora_fim TEXT DEFAULT '20h00';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS local_nome TEXT DEFAULT 'Centro de Convenções Talatona';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS local_endereco TEXT DEFAULT 'Via A1, Talatona, Luanda, Angola';
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS local_mapa_url TEXT;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS vagas_total INTEGER DEFAULT 350;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS inscricoes_abertas BOOLEAN DEFAULT true;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS data_limite_inscricao TIMESTAMPTZ;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS inscricao_paga BOOLEAN DEFAULT false;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS valor NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS instrucoes_pagamento TEXT;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS link_grupo_whatsapp TEXT;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS checkin_aberto BOOLEAN DEFAULT false;
ALTER TABLE public.eventos ADD COLUMN IF NOT EXISTS walkin_permitido BOOLEAN DEFAULT true;

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de eventos" ON public.eventos;
CREATE POLICY "Leitura pública de eventos"
  ON public.eventos FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Edição de eventos por admins" ON public.eventos;
CREATE POLICY "Edição de eventos por admins"
  ON public.eventos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 6. TABELA DE LOTES DE INGRESSOS E VAGAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.lotes_ingressos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco NUMERIC(10,2) DEFAULT 0.00,
  capacidade INTEGER NOT NULL DEFAULT 350,
  ativo BOOLEAN NOT NULL DEFAULT true,
  data_inicio TIMESTAMPTZ,
  data_fim TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lotes_ingressos ADD COLUMN IF NOT EXISTS preco NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.lotes_ingressos ADD COLUMN IF NOT EXISTS capacidade INTEGER DEFAULT 350;
ALTER TABLE public.lotes_ingressos ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;
ALTER TABLE public.lotes_ingressos ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMPTZ;
ALTER TABLE public.lotes_ingressos ADD COLUMN IF NOT EXISTS data_fim TIMESTAMPTZ;

ALTER TABLE public.lotes_ingressos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de lotes ativos" ON public.lotes_ingressos;
CREATE POLICY "Leitura pública de lotes ativos"
  ON public.lotes_ingressos FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

DROP POLICY IF EXISTS "Gestão de lotes por admins" ON public.lotes_ingressos;
CREATE POLICY "Gestão de lotes por admins"
  ON public.lotes_ingressos FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 7. SEQUÊNCIA E TABELA CENTRAL DE INSCRIÇÕES
-- ==============================================================================
CREATE SEQUENCE IF NOT EXISTS public.seq_codigo_inscricao START 1;

CREATE TABLE IF NOT EXISTS public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id UUID REFERENCES public.eventos(id) ON DELETE SET NULL,
  codigo TEXT UNIQUE,
  nome TEXT NOT NULL,
  nome_completo TEXT,
  telefone TEXT NOT NULL,
  telefone_normalizado TEXT,
  email TEXT,
  whatsapp TEXT,
  morada TEXT,
  municipio_bairro TEXT,
  igreja TEXT,
  localizacao TEXT,
  recomendacao TEXT,
  observacoes TEXT,
  admin_notes TEXT,
  faixa_etaria TEXT DEFAULT '26-35',
  como_soube TEXT DEFAULT 'Instagram',
  expectativa TEXT,
  estado TEXT NOT NULL DEFAULT 'inscrita',
  origem TEXT NOT NULL DEFAULT 'site',
  consentimento BOOLEAN NOT NULL DEFAULT true,
  consentimento_em TIMESTAMPTZ DEFAULT NOW(),
  referral_code TEXT UNIQUE,
  referred_by_code TEXT,
  meta_convidadas INTEGER,
  convidadas_count INTEGER DEFAULT 0,
  contactado_por UUID REFERENCES auth.users(id),
  contactado_em TIMESTAMPTZ,
  grupo_por UUID REFERENCES auth.users(id),
  grupo_em TIMESTAMPTZ,
  checked_in BOOLEAN NOT NULL DEFAULT false,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  lote_id UUID REFERENCES public.lotes_ingressos(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Garantir que todas as colunas existem se a tabela inscricoes já existia no banco
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS evento_id UUID;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS codigo TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS nome_completo TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS telefone_normalizado TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS morada TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS municipio_bairro TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS igreja TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS localizacao TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS recomendacao TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS observacoes TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS faixa_etaria TEXT DEFAULT '26-35';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS como_soube TEXT DEFAULT 'Instagram';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS expectativa TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'inscrita';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS origem TEXT DEFAULT 'site';
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS consentimento BOOLEAN DEFAULT true;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS consentimento_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS referred_by_code TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS meta_convidadas INTEGER;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS convidadas_count INTEGER DEFAULT 0;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS contactado_por UUID;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS contactado_em TIMESTAMPTZ;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS grupo_por UUID;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS grupo_em TIMESTAMPTZ;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS checked_in BOOLEAN DEFAULT false;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMPTZ;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS checked_in_by TEXT;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS lote_id UUID;

-- Preencher códigos para registos antigos que estejam nulos
UPDATE public.inscricoes
SET codigo = 'MUF-' || lpad(nextval('public.seq_codigo_inscricao')::text, 4, '0')
WHERE codigo IS NULL;

-- Preencher telefone_normalizado para registos antigos
UPDATE public.inscricoes
SET telefone_normalizado = public.normalize_phone(telefone)
WHERE telefone_normalizado IS NULL AND telefone IS NOT NULL;

-- Preencher nome_completo para registos antigos
UPDATE public.inscricoes
SET nome_completo = nome
WHERE nome_completo IS NULL AND nome IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_inscricoes_codigo ON public.inscricoes(codigo);
CREATE INDEX IF NOT EXISTS idx_inscricoes_telefone_norm ON public.inscricoes(telefone_normalizado);
CREATE INDEX IF NOT EXISTS idx_inscricoes_email ON public.inscricoes(lower(email));
CREATE INDEX IF NOT EXISTS idx_inscricoes_estado ON public.inscricoes(estado);

ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ver inscricoes" ON public.inscricoes;
CREATE POLICY "Admins podem ver inscricoes"
  ON public.inscricoes FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins podem alterar inscricoes" ON public.inscricoes;
CREATE POLICY "Admins podem alterar inscricoes"
  ON public.inscricoes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 8. TABELA DE INTERAÇÕES E CRM (Notas e Contactos WhatsApp)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.interaccoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inscrito_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('whatsapp', 'chamada', 'email', 'nota')),
  nota TEXT NOT NULL,
  autor_id UUID REFERENCES auth.users(id),
  autor_nome TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.interaccoes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem gerir interaccoes" ON public.interaccoes;
CREATE POLICY "Admins podem gerir interaccoes"
  ON public.interaccoes FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 9. TABELA DE ORADORAS & MENTORAS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.oradoras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  cargo TEXT NOT NULL,
  subtitulo TEXT,
  biografia TEXT,
  foto_url TEXT NOT NULL,
  is_main BOOLEAN DEFAULT false,
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.oradoras ADD COLUMN IF NOT EXISTS subtitulo TEXT;
ALTER TABLE public.oradoras ADD COLUMN IF NOT EXISTS biografia TEXT;
ALTER TABLE public.oradoras ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT false;
ALTER TABLE public.oradoras ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.oradoras ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.oradoras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de oradoras ativas" ON public.oradoras;
CREATE POLICY "Leitura pública de oradoras ativas"
  ON public.oradoras FOR SELECT
  TO anon, authenticated
  USING (visivel = true);

DROP POLICY IF EXISTS "Admins podem gerir oradoras" ON public.oradoras;
CREATE POLICY "Admins podem gerir oradoras"
  ON public.oradoras FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 10. TABELA DE PROGRAMAÇÃO & CRONOGRAMA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.programacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hora_inicio TEXT NOT NULL,
  hora_fim TEXT NOT NULL,
  periodo TEXT NOT NULL DEFAULT 'manha',
  titulo TEXT NOT NULL,
  descricao TEXT,
  oradora_id UUID REFERENCES public.oradoras(id) ON DELETE SET NULL,
  oradora_nome TEXT,
  local TEXT DEFAULT 'Auditório Principal',
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.programacao ADD COLUMN IF NOT EXISTS descricao TEXT;
ALTER TABLE public.programacao ADD COLUMN IF NOT EXISTS oradora_nome TEXT;
ALTER TABLE public.programacao ADD COLUMN IF NOT EXISTS local TEXT DEFAULT 'Auditório Principal';
ALTER TABLE public.programacao ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.programacao ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.programacao ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de programacao ativa" ON public.programacao;
CREATE POLICY "Leitura pública de programacao ativa"
  ON public.programacao FOR SELECT
  TO anon, authenticated
  USING (visivel = true);

DROP POLICY IF EXISTS "Admins podem gerir programacao" ON public.programacao;
CREATE POLICY "Admins podem gerir programacao"
  ON public.programacao FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 11. TABELA DE PARCEIROS & PATROCINADORES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL DEFAULT 'Apoio',
  responsavel TEXT,
  contacto TEXT NOT NULL,
  email TEXT,
  contribuicao TEXT,
  estado TEXT DEFAULT 'Confirmado',
  logo_url TEXT,
  website_url TEXT,
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Apoio';
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS contribuicao TEXT;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'Confirmado';
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.parceiros ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de parceiros confirmados" ON public.parceiros;
CREATE POLICY "Leitura pública de parceiros confirmados"
  ON public.parceiros FOR SELECT
  TO anon, authenticated
  USING (visivel = true AND estado = 'Confirmado');

DROP POLICY IF EXISTS "Público pode submeter pedidos de parceria" ON public.parceiros;
CREATE POLICY "Público pode submeter pedidos de parceria"
  ON public.parceiros FOR INSERT
  TO anon, authenticated
  WITH CHECK (estado = 'Em análise' OR estado = 'Pendente');

DROP POLICY IF EXISTS "Admins podem gerir parceiros" ON public.parceiros;
CREATE POLICY "Admins podem gerir parceiros"
  ON public.parceiros FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 12. TABELA DE LOGOS DE PARCEIROS (Exibições Marquee / Hero / Rodapé)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.logos_parceiros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parceiro_id UUID REFERENCES public.parceiros(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  logo_url TEXT NOT NULL,
  posicao TEXT NOT NULL DEFAULT 'carrossel',
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.logos_parceiros ADD COLUMN IF NOT EXISTS posicao TEXT DEFAULT 'carrossel';
ALTER TABLE public.logos_parceiros ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.logos_parceiros ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.logos_parceiros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de logos ativos" ON public.logos_parceiros;
CREATE POLICY "Leitura pública de logos ativos"
  ON public.logos_parceiros FOR SELECT
  TO anon, authenticated
  USING (visivel = true);

DROP POLICY IF EXISTS "Admins podem gerir logos" ON public.logos_parceiros;
CREATE POLICY "Admins podem gerir logos"
  ON public.logos_parceiros FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 13. TABELA DE GALERIA FOTOGRÁFICA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.galeria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT,
  foto_url TEXT NOT NULL,
  legenda TEXT,
  categoria TEXT DEFAULT 'Edição 2025',
  ano INTEGER DEFAULT 2025,
  ordem INTEGER DEFAULT 0,
  visivel BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS legenda TEXT;
ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Edição 2025';
ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS ano INTEGER DEFAULT 2025;
ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;
ALTER TABLE public.galeria ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;

ALTER TABLE public.galeria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de galeria ativa" ON public.galeria;
CREATE POLICY "Leitura pública de galeria ativa"
  ON public.galeria FOR SELECT
  TO anon, authenticated
  USING (visivel = true);

DROP POLICY IF EXISTS "Admins podem gerir galeria" ON public.galeria;
CREATE POLICY "Admins podem gerir galeria"
  ON public.galeria FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 14. TABELA DO CARTAZ OFICIAL
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.cartaz_oficial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL DEFAULT 'Cartaz Oficial 2026',
  descricao TEXT DEFAULT 'Cartaz em alta definição para partilha e impressão',
  imagem_url TEXT NOT NULL,
  resolucao TEXT DEFAULT '3508 x 4960 (A3)',
  tamanho TEXT DEFAULT '14.2 MB',
  ano INTEGER DEFAULT 2026,
  ativo BOOLEAN DEFAULT true,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cartaz_oficial ADD COLUMN IF NOT EXISTS resolucao TEXT DEFAULT '3508 x 4960 (A3)';
ALTER TABLE public.cartaz_oficial ADD COLUMN IF NOT EXISTS tamanho TEXT DEFAULT '14.2 MB';
ALTER TABLE public.cartaz_oficial ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

ALTER TABLE public.cartaz_oficial ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de cartaz ativo" ON public.cartaz_oficial;
CREATE POLICY "Leitura pública de cartaz ativo"
  ON public.cartaz_oficial FOR SELECT
  TO anon, authenticated
  USING (ativo = true);

DROP POLICY IF EXISTS "Admins podem gerir cartaz" ON public.cartaz_oficial;
CREATE POLICY "Admins podem gerir cartaz"
  ON public.cartaz_oficial FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 15. TABELA DE SECÇÕES E CONTEÚDOS DINÂMICOS DA LANDING PAGE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.secoes_conteudo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave TEXT UNIQUE NOT NULL,
  titulo TEXT NOT NULL,
  subtitulo TEXT,
  descricao TEXT,
  conteudo_json JSONB DEFAULT '{}'::jsonb,
  visivel BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.secoes_conteudo ADD COLUMN IF NOT EXISTS subtitulo TEXT;
ALTER TABLE public.secoes_conteudo ADD COLUMN IF NOT EXISTS conteudo_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.secoes_conteudo ADD COLUMN IF NOT EXISTS visivel BOOLEAN DEFAULT true;
ALTER TABLE public.secoes_conteudo ADD COLUMN IF NOT EXISTS ordem INTEGER DEFAULT 0;

ALTER TABLE public.secoes_conteudo ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura pública de seções" ON public.secoes_conteudo;
CREATE POLICY "Leitura pública de seções"
  ON public.secoes_conteudo FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins podem gerir seções" ON public.secoes_conteudo;
CREATE POLICY "Admins podem gerir seções"
  ON public.secoes_conteudo FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid())
  );

-- ==============================================================================
-- 16. TABELA DE LOGS DE AUDITORIA & SEGURANÇA
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.logs_auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  utilizador_id UUID REFERENCES auth.users(id),
  utilizador_nome TEXT,
  papel TEXT,
  accao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id TEXT,
  detalhes JSONB,
  ip_address TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS utilizador_nome TEXT;
ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS papel TEXT;
ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS entidade_id TEXT;
ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS detalhes JSONB;
ALTER TABLE public.logs_auditoria ADD COLUMN IF NOT EXISTS ip_address TEXT;

ALTER TABLE public.logs_auditoria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Apenas desenvolvedores leem logs de auditoria" ON public.logs_auditoria;
CREATE POLICY "Apenas desenvolvedores leem logs de auditoria"
  ON public.logs_auditoria FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins
      WHERE id = auth.uid() AND (role = 'super_admin' OR COALESCE(papel, 'desenvolvedor') = 'desenvolvedor')
    )
  );

-- ==============================================================================
-- 17. TABELAS DE VIRALIDADE & PREMIAÇÃO (REFERRALS)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_referral_pair UNIQUE (referrer_id, referred_id)
);

CREATE TABLE IF NOT EXISTS public.referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  source TEXT DEFAULT 'share',
  created_by_admin UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  total_clicks INTEGER DEFAULT 0,
  facebook_clicks INTEGER DEFAULT 0,
  instagram_clicks INTEGER DEFAULT 0,
  whatsapp_clicks INTEGER DEFAULT 0,
  direct_clicks INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.referral_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_link_id UUID NOT NULL REFERENCES public.referral_links(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'direct',
  user_agent TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prize_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  prize_level TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notified_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES public.inscricoes(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'prize_achieved',
  message TEXT NOT NULL,
  whatsapp_link TEXT,
  email_link TEXT,
  read BOOLEAN DEFAULT false,
  sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- 18. PROCEDIMENTOS ARMAZENADOS (SECURITY DEFINER RPCS)
-- ==============================================================================

-- 18.1 Função RPC: Inscrição Pública Segura com Validação de Vagas e Duplicados
CREATE OR REPLACE FUNCTION public.create_public_inscricao(
  p_nome TEXT,
  p_email TEXT,
  p_telefone TEXT,
  p_whatsapp TEXT,
  p_morada TEXT,
  p_igreja TEXT DEFAULT NULL,
  p_localizacao TEXT DEFAULT NULL,
  p_recomendacao TEXT DEFAULT NULL,
  p_observacoes TEXT DEFAULT NULL,
  p_faixa_etaria TEXT DEFAULT '26-35',
  p_como_soube TEXT DEFAULT 'Instagram',
  p_expectativa TEXT DEFAULT NULL,
  p_referral_code TEXT DEFAULT NULL,
  p_meta_convidadas INTEGER DEFAULT NULL,
  p_referred_by_code TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_abertas TEXT;
  v_norm_phone TEXT;
  v_existing_id UUID;
  v_existing_code TEXT;
  v_count_ativos INTEGER;
  v_capacidade INTEGER := 350;
  v_seq INTEGER;
  v_new_code TEXT;
  v_ref_code TEXT;
  v_estado TEXT := 'inscrita';
  v_novo_id UUID;
  v_referrer_id UUID;
  v_result JSONB;
BEGIN
  -- 1. Verificar se as inscrições estão abertas
  SELECT value INTO v_abertas FROM public.app_settings WHERE key = 'inscricoes_abertas';
  IF v_abertas = 'false' THEN
    RAISE EXCEPTION 'inscricoes_fechadas';
  END IF;

  -- 2. Normalizar telefone
  v_norm_phone := public.normalize_phone(p_telefone);
  IF length(v_norm_phone) < 10 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;

  -- 3. Verificar duplicado por telefone normalizado
  SELECT id, codigo INTO v_existing_id, v_existing_code
  FROM public.inscricoes
  WHERE telefone_normalizado = v_norm_phone
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_registration: %', v_existing_code;
  END IF;

  -- 4. Verificar capacidade total de vagas
  SELECT COUNT(*) INTO v_count_ativos
  FROM public.inscricoes
  WHERE estado NOT IN ('cancelada', 'lista_espera');

  IF v_count_ativos >= v_capacidade THEN
    v_estado := 'lista_espera';
  END IF;

  -- 5. Gerar código sequencial legível (MUF-0001, etc.)
  v_seq := nextval('public.seq_codigo_inscricao');
  v_new_code := 'MUF-' || lpad(v_seq::text, 4, '0');

  -- 6. Garantir referral code único
  v_ref_code := COALESCE(p_referral_code, lower(regexp_replace(p_nome, '\s+', '', 'g')) || '-' || substring(md5(random()::text) from 1 for 4));

  -- 7. Inserir a nova inscrição
  INSERT INTO public.inscricoes (
    codigo,
    nome,
    nome_completo,
    telefone,
    telefone_normalizado,
    email,
    whatsapp,
    morada,
    municipio_bairro,
    igreja,
    localizacao,
    recomendacao,
    observacoes,
    faixa_etaria,
    como_soube,
    expectativa,
    estado,
    origem,
    consentimento,
    referral_code,
    referred_by_code,
    meta_convidadas,
    created_at,
    updated_at
  ) VALUES (
    v_new_code,
    p_nome,
    p_nome,
    p_telefone,
    v_norm_phone,
    p_email,
    COALESCE(p_whatsapp, p_telefone),
    p_morada,
    COALESCE(p_localizacao, p_morada),
    p_igreja,
    p_localizacao,
    p_recomendacao,
    p_observacoes,
    p_faixa_etaria,
    p_como_soube,
    p_expectativa,
    v_estado,
    'site',
    true,
    v_ref_code,
    p_referred_by_code,
    p_meta_convidadas,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_novo_id;

  -- 8. Se houve código de indicação, associar à referenciadora
  IF p_referred_by_code IS NOT NULL AND p_referred_by_code <> '' THEN
    SELECT id INTO v_referrer_id
    FROM public.inscricoes
    WHERE referral_code = p_referred_by_code
    LIMIT 1;

    IF v_referrer_id IS NOT NULL AND v_referrer_id <> v_novo_id THEN
      INSERT INTO public.referrals (referrer_id, referred_id)
      VALUES (v_referrer_id, v_novo_id)
      ON CONFLICT DO NOTHING;

      UPDATE public.inscricoes
      SET convidadas_count = convidadas_count + 1
      WHERE id = v_referrer_id;
    END IF;
  END IF;

  -- 9. Retornar dados da inscrição em formato JSON
  SELECT jsonb_build_object(
    'id', v_novo_id,
    'codigo', v_new_code,
    'nome', p_nome,
    'referral_code', v_ref_code,
    'estado', v_estado
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 18.2 Função RPC: Validação e Marcação Atómica de Check-in
CREATE OR REPLACE FUNCTION public.mark_checkin(
  p_participant_id UUID,
  p_staff_name TEXT DEFAULT 'Staff Porta'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inscrito RECORD;
BEGIN
  SELECT * INTO v_inscrito
  FROM public.inscricoes
  WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participant_not_found';
  END IF;

  IF v_inscrito.checked_in THEN
    RAISE EXCEPTION 'already_checked_in';
  END IF;

  IF v_inscrito.estado = 'cancelada' THEN
    RAISE EXCEPTION 'inscricao_cancelada';
  END IF;

  UPDATE public.inscricoes
  SET 
    checked_in = true,
    checked_in_at = NOW(),
    checked_in_by = p_staff_name,
    estado = 'presente',
    updated_at = NOW()
  WHERE id = p_participant_id;

  -- Registar log de auditoria
  INSERT INTO public.logs_auditoria (
    utilizador_nome,
    papel,
    accao,
    entidade,
    entidade_id,
    detalhes
  ) VALUES (
    p_staff_name,
    'checkin',
    'CONFIRMAR_CHECKIN',
    'inscricoes',
    p_participant_id::text,
    jsonb_build_object('codigo', v_inscrito.codigo, 'nome', v_inscrito.nome)
  );

  RETURN jsonb_build_object(
    'success', true,
    'id', p_participant_id,
    'codigo', v_inscrito.codigo,
    'checked_in_at', NOW()
  );
END;
$$;

-- 18.3 Função RPC: Desfazer Check-in (com motivo obrigatório)
CREATE OR REPLACE FUNCTION public.undo_checkin(
  p_participant_id UUID,
  p_staff_name TEXT DEFAULT 'Staff Porta',
  p_reason TEXT DEFAULT 'Correção manual'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inscrito RECORD;
BEGIN
  SELECT * INTO v_inscrito FROM public.inscricoes WHERE id = p_participant_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'participant_not_found';
  END IF;

  UPDATE public.inscricoes
  SET 
    checked_in = false,
    checked_in_at = NULL,
    checked_in_by = NULL,
    estado = 'inscrita',
    updated_at = NOW()
  WHERE id = p_participant_id;

  INSERT INTO public.logs_auditoria (
    utilizador_nome,
    papel,
    accao,
    entidade,
    entidade_id,
    detalhes
  ) VALUES (
    p_staff_name,
    'gestor',
    'DESFAZER_CHECKIN',
    'inscricoes',
    p_participant_id::text,
    jsonb_build_object('codigo', v_inscrito.codigo, 'motivo', p_reason)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 18.4 Função RPC: Pesquisa Rápida para Check-in
CREATE OR REPLACE FUNCTION public.search_for_checkin(p_search TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  checked_in BOOLEAN,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT 
    i.id,
    i.nome,
    i.email,
    i.telefone,
    i.whatsapp,
    i.checked_in,
    i.checked_in_at,
    i.checked_in_by
  FROM public.inscricoes i
  WHERE 
    lower(COALESCE(i.codigo, '')) = lower(trim(p_search))
    OR lower(i.nome) LIKE '%' || lower(trim(p_search)) || '%'
    OR COALESCE(i.telefone_normalizado, '') LIKE '%' || regexp_replace(p_search, '\D', '', 'g') || '%'
  ORDER BY i.nome ASC
  LIMIT 25;
$$;

-- 18.5 Função RPC: Estatísticas do Painel de Check-in
CREATE OR REPLACE FUNCTION public.get_checkin_stats()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH counts AS (
    SELECT 
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE checked_in = true) AS checked_in
    FROM public.inscricoes
    WHERE estado <> 'cancelada'
  )
  SELECT jsonb_build_object(
    'total_inscritos', total,
    'total_checked_in', checked_in,
    'percentual', CASE WHEN total > 0 THEN round((checked_in::numeric / total::numeric) * 100, 1) ELSE 0 END
  ) FROM counts;
$$;

-- 18.6 Função RPC: Relatório Completo de Check-in
CREATE OR REPLACE FUNCTION public.get_checkin_report()
RETURNS TABLE (
  id UUID,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  whatsapp TEXT,
  checked_in BOOLEAN,
  checked_in_at TIMESTAMPTZ,
  checked_in_by TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.nome,
    i.email,
    i.telefone,
    i.whatsapp,
    i.checked_in,
    i.checked_in_at,
    i.checked_in_by,
    i.created_at
  FROM public.inscricoes i
  WHERE i.estado <> 'cancelada'
  ORDER BY i.checked_in DESC, i.nome ASC;
$$;

-- 18.7 Função RPC: Estatísticas Globais do Dashboard
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER;
  v_referrals INTEGER;
  v_clicks INTEGER;
  v_top_nome TEXT := 'Nenhum';
  v_top_count INTEGER := 0;
BEGIN
  SELECT COUNT(*) INTO v_total FROM public.inscricoes;
  SELECT COUNT(*) INTO v_referrals FROM public.referrals;
  SELECT COALESCE(SUM(total_clicks), 0) INTO v_clicks FROM public.referral_links;

  SELECT i.nome, i.convidadas_count INTO v_top_nome, v_top_count
  FROM public.inscricoes i
  ORDER BY i.convidadas_count DESC
  LIMIT 1;

  RETURN jsonb_build_object(
    'total_inscritos', v_total,
    'total_referrals', v_referrals,
    'total_prizes_achieved', 0,
    'prizes_pending_delivery', 0,
    'total_links', 0,
    'total_clicks', v_clicks,
    'facebook_clicks', 0,
    'instagram_clicks', 0,
    'whatsapp_clicks', 0,
    'direct_clicks', v_clicks,
    'top_referrer_nome', COALESCE(v_top_nome, 'Nenhum'),
    'top_referrer_count', COALESCE(v_top_count, 0)
  );
END;
$$;

-- 18.8 Função RPC: Tendência de Inscrições por Dia
CREATE OR REPLACE FUNCTION public.get_daily_registrations(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date TEXT,
  day_of_week TEXT,
  count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    to_char(d::date, 'YYYY-MM-DD') AS date,
    to_char(d::date, 'Dy') AS day_of_week,
    COUNT(i.id) AS count
  FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) d
  LEFT JOIN public.inscricoes i ON date_trunc('day', i.created_at) = d::date
  GROUP BY d::date
  ORDER BY d::date ASC;
$$;

-- 18.9 Função RPC: Consulta de Referenciadora por Código
CREATE OR REPLACE FUNCTION public.get_public_referrer_by_code(ref_code TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  meta_convidadas INTEGER,
  convidadas_count INTEGER,
  referral_code TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    i.id,
    i.nome,
    i.meta_convidadas,
    i.convidadas_count,
    i.referral_code
  FROM public.inscricoes i
  WHERE i.referral_code = ref_code
  LIMIT 1;
$$;

-- 18.10 Permissões de Execução
GRANT EXECUTE ON FUNCTION public.create_public_inscricao TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_referrer_by_code TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mark_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_for_checkin TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkin_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkin_report TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_registrations TO authenticated;

-- ==============================================================================
-- 19. GATILHOS (TRIGGERS)
-- ==============================================================================

-- 19.1 Sincronização automática do Master Admin quando inserido em auth.users
CREATE OR REPLACE FUNCTION public.handle_sync_master_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF lower(NEW.email) = 'adilson.dev@muf.ao' THEN
    INSERT INTO public.admins (id, nome, email, role, papel, ativo, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', 'Adilson Dev'),
      lower(NEW.email),
      'super_admin',
      'desenvolvedor',
      true,
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'super_admin',
      papel = 'desenvolvedor',
      ativo = true,
      email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_master_admin ON auth.users;
CREATE TRIGGER trg_sync_master_admin
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_sync_master_admin();

-- ==============================================================================
-- 20. SEMENTES DE DADOS INICIAIS (SEED DATA)
-- ==============================================================================

-- 20.1 Configurações Iniciais da Aplicação
INSERT INTO public.app_settings (key, value)
VALUES 
  ('inscricoes_abertas', 'true'),
  ('checkin_aberto', 'false'),
  ('vagas_totais', '350'),
  ('whatsapp_group_link', 'https://chat.whatsapp.com/ExemploMulheresDeFogo2026'),
  ('chave_pix_iban', 'AO06.0040.0000.1234.5678.9012.3'),
  ('evento_titulo', 'Conferência Mulheres de Fogo 2026'),
  ('evento_data', '5 de Dezembro de 2026'),
  ('evento_horario', '08h00 às 20h00'),
  ('evento_local', 'Centro de Convenções Talatona, Luanda')
ON CONFLICT (key) DO NOTHING;

-- 20.2 Evento Oficial 2026
INSERT INTO public.eventos (
  titulo,
  subtitulo,
  data_evento,
  hora_inicio,
  hora_fim,
  local_nome,
  local_endereco,
  vagas_total,
  inscricoes_abertas,
  checkin_aberto,
  walkin_permitido
) VALUES (
  'Conferência Mulheres de Fogo 2026',
  'Desperte a sua essência, viva o seu propósito.',
  '2026-12-05',
  '08h00',
  '20h00',
  'Centro de Convenções Talatona',
  'Via A1, Talatona, Luanda, Angola',
  350,
  true,
  false,
  true
) ON CONFLICT DO NOTHING;

-- 20.3 Lotes de Ingressos
INSERT INTO public.lotes_ingressos (nome, preco, capacidade, ativo)
VALUES 
  ('1º Lote — Acesso Geral Gratuito', 0.00, 300, true),
  ('2º Lote — Apoio Solidário', 5000.00, 50, false)
ON CONFLICT DO NOTHING;

-- 20.4 Oradoras Oficiais
INSERT INTO public.oradoras (nome, cargo, subtitulo, biografia, foto_url, is_main, ordem, visivel)
VALUES 
  (
    'Dra. Maria Santos',
    'Mentora e Escritora',
    'Especialista em Liderança Feminina',
    'Especialista em liderança feminina, inteligência emocional e mentoria de mulheres em África e na Europa.',
    '',
    true,
    1,
    true
  ),
  (
    'Pastora Ana Paula',
    'Líder de Ministério e Conferencista',
    'Fortalecimento Espiritual',
    'Pioneira no ensino bíblico focado em restauração de famílias, liderança servidora e impacto social na comunidade.',
    '',
    true,
    2,
    true
  ),
  (
    'Eng.ª Ruth Cardoso',
    'Empresária e Mentora de Carreiras',
    'Inovação e Empreendedorismo',
    'Executiva de renome nacional no setor tecnológico e incentivadora do protagonismo feminino em mercados corporativos.',
    '',
    true,
    3,
    true
  )
ON CONFLICT DO NOTHING;

-- 20.5 Programação Oficial
INSERT INTO public.programacao (hora_inicio, hora_fim, periodo, titulo, descricao, oradora_nome, local, ordem, visivel)
VALUES 
  ('08h00', '09h30', 'manha', 'Credenciamento e Boas-Vindas', 'Acolhimento caloroso das participantes, entrega de credenciais e kits oficiais.', 'Equipa WEX', 'Foyer Principal', 1, true),
  ('09h30', '11h00', 'manha', 'Sessão de Abertura: Identidade e Propósito', 'Palestra inspiradora sobre o papel ativo e regenerador da mulher na sociedade.', 'Dra. Maria Santos', 'Auditório Principal', 2, true),
  ('11h00', '12h00', 'manha', 'Pausa para Café e Networking', 'Conexão entre líderes, comunhão e visita aos espaços dos patrocinadores.', 'Geral', 'Galeria de Convivência', 3, true),
  ('13h30', '15h30', 'tarde', 'Painel de Liderança e Gestão Emocional', 'Debate interativo sobre conciliação de carreira, ministério e saúde mental.', 'Pastora Ana Paula', 'Auditório Principal', 4, true),
  ('15h30', '17h00', 'tarde', 'Oficina Prática de Propósito & Carreira', 'Ferramentas práticas de liderança e planeamento para o próximo ano.', 'Eng.ª Ruth Cardoso', 'Auditório Principal', 5, true),
  ('18h00', '19h30', 'encerramento', 'Plenária de Clamor e Encerramento', 'Momento culminante de edificação espiritual, capacitação e envio.', 'Pastora Ana Paula & Dra. Maria Santos', 'Auditório Principal', 6, true),
  ('19h30', '20h00', 'encerramento', 'Registo Fotográfico e Despedida', 'Fotos oficiais com oradoras e celebração final do evento.', 'Equipa WEX', 'Auditório Principal', 7, true)
ON CONFLICT DO NOTHING;

-- 20.6 Parceiros e Patrocinadores Iniciais
INSERT INTO public.parceiros (nome, categoria, responsavel, contacto, estado, ordem, visivel)
VALUES 
  ('A-Design Angola', 'Diamante', 'Adilson Designer', '+244932583167', 'Confirmado', 1, true),
  ('Mediateca de Luanda', 'Institucional', 'Direção Geral', '+244923000000', 'Confirmado', 2, true),
  ('Rádio Luanda Gospel', 'Apoio', 'Coordenação de Programas', '+244912000000', 'Confirmado', 3, true)
ON CONFLICT DO NOTHING;

-- 20.7 Logos de Parceiros
INSERT INTO public.logos_parceiros (nome, logo_url, posicao, ordem, visivel)
VALUES 
  ('A-Design Angola', '/images/partners/adesign.png', 'carrossel', 1, true),
  ('Centro de Convenções Talatona', '/images/partners/talatona.png', 'carrossel', 2, true),
  ('Apoio Institucional', '/images/partners/institucional.png', 'carrossel', 3, true)
ON CONFLICT DO NOTHING;

-- 20.8 Secções e Conteúdo
INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, visivel, ordem)
VALUES 
  ('hero', 'CONFERÊNCIA MULHERES DE FOGO 2026', 'Imersão WEX — Woman Experience', 'O maior encontro de capacitação espiritual, liderança e mentoria feminina em Luanda.', true, 1),
  ('visao', 'O Propósito da Imersão', 'Porquê Mulheres de Fogo?', 'Uma experiência imersiva desenhada para destravar o potencial adormecido e ativar a identidade plena.', true, 2),
  ('programacao', 'Cronograma Geral', 'O Teu Dia de Transformação', 'Uma jornada completa de 12 horas estruturada em turnos de manhã, tarde e encerramento.', true, 3),
  ('oradoras', 'Preletoras e Mentoras', 'Vozes que Inspiram Nações', 'Mulheres de comprovado testemunho e excelência no púlpito, na academia e nos negócios.', true, 4),
  ('parcerias', 'Rede de Parceiros', 'Quem caminha connosco', 'Instituições e marcas que tornam este evento de alto impacto possível.', true, 5),
  ('logistica', 'Localização & Acesso', 'Tudo preparado para te acolher', 'Garanta a sua vaga gratuita com antecedência. Lotação limitada a 350 participantes.', true, 6)
ON CONFLICT (chave) DO NOTHING;

-- 20.9 Cartaz Oficial Inicial
INSERT INTO public.cartaz_oficial (titulo, imagem_url, resolucao, tamanho, ano, ativo)
VALUES (
  'Cartaz Oficial — Conferência Mulheres de Fogo 2026',
  '/assets/images/moderna_hero_architecture_1795039044169.jpg',
  '3508 x 4960 (A3 a 300 DPI)',
  '14.2 MB',
  2026,
  true
) ON CONFLICT DO NOTHING;

-- ==============================================================================
-- 21. RPC DE AUTO-RECUPERAÇÃO E VINCULAÇÃO DO MASTER ADMIN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sync_admin_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_admin RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_user_id;

  -- Se for o email do desenvolvedor mestre, assegurar registo com privilégios totais
  IF v_email = 'adilson.dev@muf.ao' THEN
    DELETE FROM public.admins WHERE lower(email) = v_email AND id <> v_user_id;

    INSERT INTO public.admins (id, nome, email, role, papel, ativo, created_at)
    VALUES (v_user_id, 'Adilson Dev', v_email, 'super_admin', 'desenvolvedor', true, NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'super_admin',
      papel = 'desenvolvedor',
      ativo = true,
      email = EXCLUDED.email;
  END IF;

  SELECT * INTO v_admin FROM public.admins WHERE id = v_user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_admin);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_admin_profile TO authenticated;

-- 21.1 Sincronização Imediata caso adilson.dev@muf.ao já esteja criado no Supabase Auth
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'adilson.dev@muf.ao';
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NOT NULL THEN
    DELETE FROM public.admins WHERE lower(email) = lower(v_email) AND id <> v_user_id;

    INSERT INTO public.admins (id, nome, email, role, papel, ativo, created_at)
    VALUES (v_user_id, 'Adilson Dev', lower(v_email), 'super_admin', 'desenvolvedor', true, NOW())
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'super_admin',
      papel = 'desenvolvedor',
      ativo = true,
      email = EXCLUDED.email;

    RAISE NOTICE 'Utilizador % sincronizado com sucesso como super_admin!', v_email;
  ELSE
    RAISE NOTICE 'Nota: Utilizador % ainda não existe no Auth > Users do Supabase.', v_email;
  END IF;
END $$;

