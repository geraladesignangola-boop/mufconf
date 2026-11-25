-- ==============================================================================
-- 033. DADOS REAIS NO PAINEL + RELATOS + PESQUISA DE BILHETE
-- ------------------------------------------------------------------------------
-- Corrige lacunas detetadas na leitura do código do projecto:
--
--   1. `get_daily_clicks` era chamada pelo frontend (AdminDashboard → gráfico
--      "Cliques por dia da semana") mas NUNCA foi criada — o gráfico ficava
--      estático, a mostrar barras de zero. Passa a existir, alimentada pela
--      tabela de eventos `referral_link_clicks`.
--
--   2. `get_dashboard_stats` devolvia zeros fixos para `total_links`,
--      `total_prizes_achieved`, `prizes_pending_delivery` e para todos os
--      canais de cliques (facebook/instagram/whatsapp). O funil, o donut e os
--      alertas mapeavam, por isso, valores inventados. Passa a somar dados
--      reais de `referral_links` e `prize_claims`.
--      `total_inscritos` também passa a excluir inscrições canceladas (antes
--      contava todas, o que inflava a ocupação e contradizia o check-in).
--
--   3. `get_daily_registrations` passa a excluir inscrições canceladas.
--
--   4. NOVA `get_capacidade_stats`: fonte única para o módulo "Ingressos e
--      Vagas" (capacidade, confirmadas, lista de espera, canceladas, livres,
--      ocupação) — antes o módulo usava o total bruto de linhas.
--
--   5. NOVA tabela `relatos` + RPC pública `create_public_relato`: permite à
--      pessoa relatar um problema de inscrição ou deixar um comentário, com
--      gestão no painel admin (estado + nota interna).
--
--   6. NOVA RPC pública `get_public_bilhete`: pesquisa de bilhete por
--      nome/e-mail/código COM CONFIRMAÇÃO OBRIGATÓRIA do telefone registado —
--      dois factores, para ninguém consultar dados de terceiros.
--
-- Idempotente: pode correr várias vezes. Aplicar no SQL Editor do Supabase
-- (ou `supabase db push`) ANTES do deploy do frontend que usa estas funções.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CLIQUES POR DIA (gráfico "Cliques por dia da semana")
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_daily_clicks(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date TEXT,
  day_of_week TEXT,
  total BIGINT,
  whatsapp BIGINT,
  facebook BIGINT,
  instagram BIGINT,
  direct BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- `direct` absorve cliques sem canal conhecido (inclui a fonte 'direct'),
  -- garantindo que whatsapp + facebook + instagram + direct = total.
  RETURN QUERY
  SELECT
    to_char(d::date, 'YYYY-MM-DD') AS data_col,
    to_char(d::date, 'Dy') AS dia_col,
    COUNT(c.id) AS total_col,
    COUNT(c.id) FILTER (WHERE c.source = 'whatsapp') AS whatsapp_col,
    COUNT(c.id) FILTER (WHERE c.source = 'facebook') AS facebook_col,
    COUNT(c.id) FILTER (WHERE c.source = 'instagram') AS instagram_col,
    COUNT(c.id) FILTER (WHERE c.source IS NULL OR c.source NOT IN ('whatsapp', 'facebook', 'instagram')) AS direct_col
  FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) d
  LEFT JOIN public.referral_link_clicks c ON c.clicked_at::date = d::date
  GROUP BY d::date
  ORDER BY d::date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_clicks(INTEGER) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_clicks(INTEGER) TO authenticated;

-- ------------------------------------------------------------------------------
-- 2. ESTATÍSTICAS DO DASHBOARD — valores reais (substitui os zeros fixos)
-- ------------------------------------------------------------------------------
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
  v_links INTEGER;
  v_clicks BIGINT;
  v_fb BIGINT;
  v_ig BIGINT;
  v_wa BIGINT;
  v_direct BIGINT;
  v_soma BIGINT;
  v_prizes INTEGER;
  v_pending INTEGER;
  v_top_nome TEXT := 'Nenhum';
  v_top_count INTEGER := 0;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  -- Inscritas: exclui canceladas (alinhado com get_checkin_stats e com o
  -- critério de capacidade usado em create_public_inscricao).
  SELECT COUNT(*) INTO v_total
  FROM public.inscricoes
  WHERE estado <> 'cancelada';

  SELECT COUNT(*) INTO v_referrals FROM public.referrals;
  SELECT COUNT(*) INTO v_links FROM public.referral_links;

  -- Cliques por canal (contadores agregados por link de indicação)
  SELECT
    COALESCE(SUM(total_clicks), 0),
    COALESCE(SUM(facebook_clicks), 0),
    COALESCE(SUM(instagram_clicks), 0),
    COALESCE(SUM(whatsapp_clicks), 0),
    COALESCE(SUM(direct_clicks), 0)
  INTO v_clicks, v_fb, v_ig, v_wa, v_direct
  FROM public.referral_links;

  -- Coerência interna: a soma dos canais nunca pode ultrapassar o total, e
  -- eventuais cliques sem canal conhecido ficam contabilizados como diretos.
  v_soma := COALESCE(v_fb, 0) + COALESCE(v_ig, 0) + COALESCE(v_wa, 0) + COALESCE(v_direct, 0);
  v_clicks := GREATEST(COALESCE(v_clicks, 0), v_soma);
  v_direct := COALESCE(v_direct, 0) + (v_clicks - v_soma);

  -- Prémios: registados vs. por entregar (antes devolvia sempre 0)
  SELECT COUNT(*) INTO v_prizes FROM public.prize_claims;
  SELECT COUNT(*) INTO v_pending FROM public.prize_claims WHERE status = 'pending';

  SELECT i.nome, i.convidadas_count INTO v_top_nome, v_top_count
  FROM public.inscricoes i
  WHERE i.estado <> 'cancelada'
  ORDER BY i.convidadas_count DESC, i.created_at ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'total_inscritos', COALESCE(v_total, 0),
    'total_referrals', COALESCE(v_referrals, 0),
    'total_prizes_achieved', COALESCE(v_prizes, 0),
    'prizes_pending_delivery', COALESCE(v_pending, 0),
    'total_links', COALESCE(v_links, 0),
    'total_clicks', COALESCE(v_clicks, 0),
    'facebook_clicks', COALESCE(v_fb, 0),
    'instagram_clicks', COALESCE(v_ig, 0),
    'whatsapp_clicks', COALESCE(v_wa, 0),
    'direct_clicks', COALESCE(v_direct, 0),
    'top_referrer_nome', COALESCE(v_top_nome, 'Nenhum'),
    'top_referrer_count', COALESCE(v_top_count, 0)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. TENDÊNCIA DE INSCRIÇÕES — exclui canceladas
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_daily_registrations(p_days INTEGER DEFAULT 7)
RETURNS TABLE (
  date TEXT,
  day_of_week TEXT,
  count BIGINT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    to_char(d::date, 'YYYY-MM-DD') AS data_col,
    to_char(d::date, 'Dy') AS dia_col,
    COUNT(i.id) AS count_col
  FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) d
  LEFT JOIN public.inscricoes i
    ON date_trunc('day', i.created_at) = d::date
   AND i.estado <> 'cancelada'
  GROUP BY d::date
  ORDER BY d::date ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_registrations(INTEGER) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_registrations(INTEGER) TO authenticated;

-- ------------------------------------------------------------------------------
-- 4. CAPACIDADE DO EVENTO (módulo "Ingressos e Vagas")
--     Critério de "ocupa vaga" idêntico ao de create_public_inscricao:
--     estado NOT IN ('cancelada', 'lista_espera').
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_capacidade_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_capacidade INTEGER;
  v_confirmadas INTEGER;
  v_espera INTEGER;
  v_canceladas INTEGER;
  v_presentes INTEGER;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  SELECT CASE WHEN value ~ '^[0-9]+$' THEN value::INTEGER END
  INTO v_capacidade
  FROM public.app_settings
  WHERE key = 'vagas_totais';

  v_capacidade := COALESCE(v_capacidade, 350);

  SELECT COUNT(*) INTO v_confirmadas
  FROM public.inscricoes
  WHERE estado NOT IN ('cancelada', 'lista_espera');

  SELECT COUNT(*) INTO v_espera
  FROM public.inscricoes
  WHERE estado = 'lista_espera';

  SELECT COUNT(*) INTO v_canceladas
  FROM public.inscricoes
  WHERE estado = 'cancelada';

  SELECT COUNT(*) INTO v_presentes
  FROM public.inscricoes
  WHERE checked_in = true
    AND estado <> 'cancelada';

  RETURN jsonb_build_object(
    'capacidade', v_capacidade,
    'confirmadas', COALESCE(v_confirmadas, 0),
    'lista_espera', COALESCE(v_espera, 0),
    'canceladas', COALESCE(v_canceladas, 0),
    'presentes', COALESCE(v_presentes, 0),
    'livres', GREATEST(v_capacidade - COALESCE(v_confirmadas, 0), 0),
    'ocupacao',
      CASE
        WHEN v_capacidade > 0
          THEN LEAST(100, ROUND(COALESCE(v_confirmadas, 0)::numeric / v_capacidade * 100))::INTEGER
        ELSE 0
      END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_capacidade_stats() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_capacidade_stats() TO authenticated;

-- ------------------------------------------------------------------------------
-- 5. RELATOS DE PROBLEMAS / COMENTÁRIOS (site → painel admin)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.relatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'problema' CHECK (tipo IN ('problema', 'comentario')),
  nome TEXT NOT NULL,
  contacto TEXT,
  mensagem TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'novo' CHECK (estado IN ('novo', 'em_curso', 'resolvido')),
  admin_notes TEXT,
  inscrito_id UUID REFERENCES public.inscricoes(id) ON DELETE SET NULL,
  resolvido_em TIMESTAMPTZ,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS tipo TEXT DEFAULT 'problema';
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS nome TEXT;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS contacto TEXT;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS mensagem TEXT;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'novo';
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS inscrito_id UUID;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS resolvido_em TIMESTAMPTZ;
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS criado_em TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.relatos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_relatos_estado ON public.relatos(estado);
CREATE INDEX IF NOT EXISTS idx_relatos_criado_em ON public.relatos(criado_em DESC);

ALTER TABLE public.relatos ENABLE ROW LEVEL SECURITY;

-- O site público nunca lê nem escreve `relatos` directamente (RLS sem política
-- para `anon` + revogação explícita); tudo passa pelas RPCs SECURITY DEFINER.
REVOKE ALL ON public.relatos FROM anon;
GRANT SELECT, UPDATE ON public.relatos TO authenticated;

-- Leitura e gestão: apenas administradores ativos.
-- (não existe qualquer política para `anon` → o site público só escreve via RPC)
DROP POLICY IF EXISTS "Admins gerem relatos" ON public.relatos;
CREATE POLICY "Admins gerem relatos"
  ON public.relatos FOR ALL
  TO authenticated
  USING (public.is_admin_user())
  WITH CHECK (public.is_admin_user());

-- 5.1 RPC pública de submissão (SECURITY DEFINER: valida e grava)
CREATE OR REPLACE FUNCTION public.create_public_relato(
  p_tipo TEXT,
  p_nome TEXT,
  p_contacto TEXT DEFAULT NULL,
  p_mensagem TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tipo TEXT;
  v_nome TEXT;
  v_contacto TEXT;
  v_mensagem TEXT;
  v_recentes INTEGER;
  v_inscrito UUID := NULL;
  v_norm TEXT;
BEGIN
  v_tipo := lower(trim(COALESCE(p_tipo, 'problema')));
  IF v_tipo NOT IN ('problema', 'comentario') THEN
    v_tipo := 'problema';
  END IF;

  v_nome := trim(COALESCE(p_nome, ''));
  v_contacto := NULLIF(trim(COALESCE(p_contacto, '')), '');
  v_mensagem := trim(COALESCE(p_mensagem, ''));

  IF length(v_nome) < 2 OR length(v_nome) > 120 THEN
    RAISE EXCEPTION 'relato_invalido';
  END IF;
  IF length(v_mensagem) < 5 OR length(v_mensagem) > 2000 THEN
    RAISE EXCEPTION 'relato_invalido';
  END IF;
  IF v_contacto IS NOT NULL AND length(v_contacto) > 120 THEN
    RAISE EXCEPTION 'relato_invalido';
  END IF;

  -- Proteção anti-spam: no máximo 5 relatos por contacto por hora
  IF v_contacto IS NOT NULL THEN
    SELECT COUNT(*) INTO v_recentes
    FROM public.relatos
    WHERE lower(COALESCE(contacto, '')) = lower(v_contacto)
      AND criado_em > NOW() - INTERVAL '1 hour';

    IF v_recentes >= 5 THEN
      RAISE EXCEPTION 'relato_frequente';
    END IF;
  END IF;

  -- Se o contacto for um telefone de inscrita, associa o relato à inscrição
  v_norm := public.normalize_phone(v_contacto);
  IF length(v_norm) >= 10 THEN
    SELECT id INTO v_inscrito
    FROM public.inscricoes
    WHERE telefone_normalizado = v_norm
       OR public.normalize_phone(telefone) = v_norm
    ORDER BY created_at DESC
    LIMIT 1;
  END IF;

  INSERT INTO public.relatos (tipo, nome, contacto, mensagem, estado, inscrito_id)
  VALUES (v_tipo, v_nome, v_contacto, v_mensagem, 'novo', v_inscrito);

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.create_public_relato(TEXT, TEXT, TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.create_public_relato(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. PESQUISA DE BILHETE (público, com proteção de dados pessoais)
--     Exige DOIS factores para devolver dados:
--       1) termo de pesquisa (nome, e-mail, código de inscrição ou código de
--          indicação) — nunca um telefone, para o segundo factor ser sempre
--          independente;
--       2) telefone registado na inscrição (normalizado).
--     Resposta idêntica quando não há correspondência e quando o telefone não
--     confere — não revela a existência de inscrições de terceiros.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_bilhete(
  p_termo TEXT,
  p_telefone TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_termo TEXT;
  v_tel TEXT;
  v_row RECORD;
BEGIN
  v_termo := lower(trim(COALESCE(p_termo, '')));
  v_tel := public.normalize_phone(p_telefone);

  IF length(v_termo) < 3 OR length(v_tel) < 10 THEN
    RETURN NULL;
  END IF;

  SELECT
    i.nome,
    i.telefone,
    i.email,
    i.igreja,
    i.municipio_bairro,
    i.localizacao,
    i.faixa_etaria,
    i.codigo,
    i.referral_code,
    i.estado,
    i.created_at
  INTO v_row
  FROM public.inscricoes i
  WHERE (
        strpos(lower(i.nome), v_termo) > 0
     OR strpos(lower(COALESCE(i.nome_completo, '')), v_termo) > 0
     OR strpos(lower(COALESCE(i.email, '')), v_termo) > 0
     OR strpos(lower(COALESCE(i.codigo, '')), v_termo) > 0
     OR strpos(lower(COALESCE(i.referral_code, '')), v_termo) > 0
  )
  AND (
        i.telefone_normalizado = v_tel
     OR public.normalize_phone(i.telefone) = v_tel
  )
  ORDER BY i.created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'nome', v_row.nome,
    'telefone', v_row.telefone,
    'email', v_row.email,
    'igreja', v_row.igreja,
    'municipio', COALESCE(v_row.municipio_bairro, v_row.localizacao),
    'faixa_etaria', v_row.faixa_etaria,
    'codigo', v_row.codigo,
    'referral_code', v_row.referral_code,
    'estado', v_row.estado,
    'criado_em', v_row.created_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_public_bilhete(TEXT, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_public_bilhete(TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 7. ATRIBUIÇÃO AUTOMÁTICA DE LOTE (a tabela `lotes_ingressos` era decorativa)
--     Nenhuma RPC gravava `inscricoes.lote_id`, por isso a tabela "Lotes
--     Oficiais" mostrava sempre 0 emitidos. Passa a atribuir-se sozinho:
--     primeira inscrição ocupa o lote activo com lugares, pela ordem de abertura.
--     Inscrições em lista de espera ou canceladas não ocupam lote.
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.assign_lote_on_inscricao()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_lote_id UUID;
BEGIN
  -- O admin pode indicar o lote manualmente — nesse caso não se mexe.
  IF NEW.lote_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.estado IN ('cancelada', 'lista_espera') THEN
    RETURN NEW;
  END IF;

  SELECT l.id INTO v_lote_id
  FROM public.lotes_ingressos l
  WHERE l.ativo = true
    AND (
      SELECT COUNT(*)
      FROM public.inscricoes i
      WHERE i.lote_id = l.id
        AND i.estado <> 'cancelada'
    ) < l.capacidade
  ORDER BY COALESCE(l.data_inicio, l.criado_em) ASC, l.criado_em ASC, l.id ASC
  LIMIT 1;

  NEW.lote_id := v_lote_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_lote_on_inscricao ON public.inscricoes;
CREATE TRIGGER trg_assign_lote_on_inscricao
  BEFORE INSERT ON public.inscricoes
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_lote_on_inscricao();
