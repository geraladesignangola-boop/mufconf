-- ==============================================================================
-- 020: RPCs DO PAINEL — VISÃO GERAL E DETALHE DE PARTICIPANTES
-- ------------------------------------------------------------------------------
-- O frontend (src/pages/AdminPanel.tsx) chama duas RPCs que nunca foram criadas
-- na base de dados. O PostgREST devolvia PGRST202:
--
--   * get_admin_participants_overview()  -> tabela de participantes do painel
--   * get_admin_participant_detail(id)   -> modal "vista detalhada"
--
-- Sem elas o modal caía sempre no modo básico, mostrando a mensagem
-- "Migrations novas ainda nao aplicadas; a vista detalhada esta em modo basico."
--
-- Esta migração cria também as colunas `group_added_at` / `group_added_by` em
-- `inscricoes` (usadas pelo botão "Adicionar ao grupo", pelos filtros
-- "Já no grupo" / "Pendente" e pelo modal) que ainda não existiam na tabela.
--
-- Ambas as RPCs são SECURITY DEFINER e verificam `is_admin_user()` antes de
-- devolver dados pessoais (nome, telefone, email, morada...).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CONTROLO DO GRUPO DE WHATSAPP (colunas usadas pelo frontend)
-- ------------------------------------------------------------------------------
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS group_added_at TIMESTAMPTZ;
ALTER TABLE public.inscricoes ADD COLUMN IF NOT EXISTS group_added_by UUID;

-- Backfill a partir das colunas legadas grupo_em / grupo_por (app anterior)
UPDATE public.inscricoes
SET group_added_at = grupo_em,
    group_added_by = grupo_por
WHERE group_added_at IS NULL
  AND grupo_em IS NOT NULL;

-- Índices para as agregações por participante
CREATE INDEX IF NOT EXISTS idx_referral_links_participant ON public.referral_links(participant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_participant ON public.notifications(participant_id);
CREATE INDEX IF NOT EXISTS idx_prize_claims_participant ON public.prize_claims(participant_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_id);

-- ------------------------------------------------------------------------------
-- 2. RPC: VISÃO GERAL DOS PARTICIPANTES (lista do painel)
-- ------------------------------------------------------------------------------
-- Devolve uma linha JSON por inscrição: todas as colunas de `inscricoes`
-- (via to_jsonb) mais os campos calculados que a UI espera em
-- AdminParticipantOverview (src/types/database.ts).
CREATE OR REPLACE FUNCTION public.get_admin_participants_overview()
RETURNS SETOF jsonb
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
    to_jsonb(i) || jsonb_build_object(
      -- Quem indicou esta participante (referrals, com fallback por código)
      'referred_by_nome',
        COALESCE(
          (SELECT r.nome
             FROM public.referrals rf
             JOIN public.inscricoes r ON r.id = rf.referrer_id
            WHERE rf.referred_id = i.id
            ORDER BY rf.created_at DESC
            LIMIT 1),
          (SELECT r.nome
             FROM public.inscricoes r
            WHERE r.referral_code = i.referred_by_code
              AND r.id <> i.id)
        ),
      -- Nome do admin que adicionou ao grupo
      'group_added_by_nome',
        (SELECT a.nome FROM public.admins a WHERE a.id = i.group_added_by),
      -- Links de indicação: linhas em referral_links + o link principal
      -- (referral_code), que não tem linha própria na tabela.
      'total_links',
        (SELECT COUNT(*) FROM public.referral_links l WHERE l.participant_id = i.id)
        + CASE
            WHEN i.referral_code IS NOT NULL
             AND NOT EXISTS (
                   SELECT 1 FROM public.referral_links l
                    WHERE l.participant_id = i.id AND l.token = i.referral_code
                 )
            THEN 1
            ELSE 0
          END,
      -- Cliques agregados por canal (contadores de referral_links)
      'total_clicks',
        COALESCE((SELECT SUM(l.total_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'facebook_clicks',
        COALESCE((SELECT SUM(l.facebook_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'instagram_clicks',
        COALESCE((SELECT SUM(l.instagram_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'whatsapp_clicks',
        COALESCE((SELECT SUM(l.whatsapp_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'direct_clicks',
        COALESCE((SELECT SUM(l.direct_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      -- Link mais recente (com fallback para o link principal)
      'latest_link_id',
        (SELECT l.id FROM public.referral_links l
          WHERE l.participant_id = i.id
          ORDER BY l.created_at DESC, l.id DESC LIMIT 1),
      'latest_link_token',
        COALESCE(
          (SELECT l.token FROM public.referral_links l
            WHERE l.participant_id = i.id
            ORDER BY l.created_at DESC, l.id DESC LIMIT 1),
          i.referral_code
        ),
      'latest_link_label',
        COALESCE(
          (SELECT l.label FROM public.referral_links l
            WHERE l.participant_id = i.id
            ORDER BY l.created_at DESC, l.id DESC LIMIT 1),
          'Link principal'
        ),
      'latest_link_created_at',
        COALESCE(
          (SELECT l.created_at FROM public.referral_links l
            WHERE l.participant_id = i.id
            ORDER BY l.created_at DESC, l.id DESC LIMIT 1),
          i.created_at
        ),
      -- Prémio atribuído no pódio (prize_claims)
      'prize_level',
        (SELECT pc.prize_level FROM public.prize_claims pc
          WHERE pc.participant_id = i.id
          ORDER BY pc.created_at DESC LIMIT 1),
      'prize_achieved',
        EXISTS (SELECT 1 FROM public.prize_claims pc WHERE pc.participant_id = i.id)
    )
  FROM public.inscricoes i
  ORDER BY i.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_participants_overview() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_participants_overview() TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. RPC: DETALHE DE UM PARTICIPANTE (modal do painel)
-- ------------------------------------------------------------------------------
-- Devolve uma única linha com 4 objetos JSON, exatamente na forma de
-- ParticipantDetail { participant, links, notifications, click_summary }.
CREATE OR REPLACE FUNCTION public.get_admin_participant_detail(target_id UUID)
RETURNS TABLE (
  participant JSONB,
  links JSONB,
  notifications JSONB,
  click_summary JSONB
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
    -- Cadastro completo + campos calculados
    to_jsonb(i) || jsonb_build_object(
      'referred_by_nome',
        COALESCE(
          (SELECT r.nome
             FROM public.referrals rf
             JOIN public.inscricoes r ON r.id = rf.referrer_id
            WHERE rf.referred_id = i.id
            ORDER BY rf.created_at DESC
            LIMIT 1),
          (SELECT r.nome
             FROM public.inscricoes r
            WHERE r.referral_code = i.referred_by_code
              AND r.id <> i.id)
        ),
      'group_added_by_nome',
        (SELECT a.nome FROM public.admins a WHERE a.id = i.group_added_by),
      'total_links',
        (SELECT COUNT(*) FROM public.referral_links l WHERE l.participant_id = i.id)
        + CASE
            WHEN i.referral_code IS NOT NULL
             AND NOT EXISTS (
                   SELECT 1 FROM public.referral_links l
                    WHERE l.participant_id = i.id AND l.token = i.referral_code
                 )
            THEN 1
            ELSE 0
          END,
      'total_clicks',
        COALESCE((SELECT SUM(l.total_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'facebook_clicks',
        COALESCE((SELECT SUM(l.facebook_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'instagram_clicks',
        COALESCE((SELECT SUM(l.instagram_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'whatsapp_clicks',
        COALESCE((SELECT SUM(l.whatsapp_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'direct_clicks',
        COALESCE((SELECT SUM(l.direct_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0)
    ),
    -- Histórico de links (mais recente primeiro: índice 0 = "Atual")
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(l) ORDER BY l.created_at DESC, l.id DESC)
         FROM public.referral_links l
        WHERE l.participant_id = i.id),
      '[]'::jsonb
    ),
    -- Notificações (mais recente primeiro)
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(n) ORDER BY n.created_at DESC, n.id DESC)
         FROM public.notifications n
        WHERE n.participant_id = i.id),
      '[]'::jsonb
    ),
    -- Resumo de cliques exibido nos cartões do modal
    jsonb_build_object(
      'total_links',
        (SELECT COUNT(*) FROM public.referral_links l WHERE l.participant_id = i.id)
        + CASE
            WHEN i.referral_code IS NOT NULL
             AND NOT EXISTS (
                   SELECT 1 FROM public.referral_links l
                    WHERE l.participant_id = i.id AND l.token = i.referral_code
                 )
            THEN 1
            ELSE 0
          END,
      'total_clicks',
        COALESCE((SELECT SUM(l.total_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'facebook_clicks',
        COALESCE((SELECT SUM(l.facebook_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'instagram_clicks',
        COALESCE((SELECT SUM(l.instagram_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'whatsapp_clicks',
        COALESCE((SELECT SUM(l.whatsapp_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0),
      'direct_clicks',
        COALESCE((SELECT SUM(l.direct_clicks) FROM public.referral_links l WHERE l.participant_id = i.id), 0)
    )
  FROM public.inscricoes i
  WHERE i.id = target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.get_admin_participant_detail(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_participant_detail(UUID) TO authenticated;
