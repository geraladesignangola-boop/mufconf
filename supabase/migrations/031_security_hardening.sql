-- ==============================================================================
-- 031. HARDENING DE SEGURANÇA — RBAC, RLS E RPCs
-- ------------------------------------------------------------------------------
-- Corrige falhas críticas detetadas na auditoria:
--
--   1. `admins`: o INSERT permitia `id = auth.uid()` (auto-registo) e o UPDATE
--      permitia auto-promoção de role/papel/ativo. Passa a ser gerido apenas por
--      super_admin via RPC `admin_grant_admin_access`, com trigger que impede
--      não-super-admins de alterar campos privilegiados.
--
--   2. `is_super_admin()` aceitava `papel = 'desenvolvedor'`, que é o DEFAULT da
--      coluna — ou seja, qualquer admin era super-admin. Passa a exigir
--      `role = 'super_admin'`.
--
--   3. `is_admin_user()` não verificava `ativo` — contas desativadas mantinham
--      acesso às RPCs.
--
--   4. RPCs SECURITY DEFINER de check-in/dashboard eram executáveis por
--      qualquer `authenticated` (e por `public` por defeito do Postgres) sem
--      verificar admin. Passam a exigir `is_admin_user()`.
--
--   5. `app_settings` era legível por `anon` na totalidade (USING true),
--      expondo chaves internas (ex.: chave_pix_iban). O anon passa a ler apenas
--      a whitelist de chaves que o site público precisa.
--
-- Idempotente: pode correr várias vezes. Aplicar no SQL Editor do Supabase
-- (ou `supabase db push`) ANTES do deploy do frontend que usa a nova RPC.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. FUNÇÕES AUXILIARES
-- ------------------------------------------------------------------------------

-- 1.1 is_admin_user: admin ativo apenas
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admins admins_row
    WHERE admins_row.id = auth.uid()
      AND COALESCE(admins_row.ativo, true) = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- 1.2 is_super_admin: apenas role = 'super_admin' (o papel já não concede admin)
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND COALESCE(ativo, true) = true
  );
$$;

-- O default 'desenvolvedor' do papel deixou de fazer sentido: criava super-admins
-- acidentais. Novos registos passam a nascer como 'gestor' salvo indicação em contrário.
ALTER TABLE public.admins ALTER COLUMN papel SET DEFAULT 'gestor';

-- Alinha registos antigos que tenham papel 'desenvolvedor' mas role 'admin'
-- (nunca foram super-admin de facto; evita confusão no painel).
UPDATE public.admins
SET papel = 'gestor'
WHERE papel = 'desenvolvedor'
  AND role IS DISTINCT FROM 'super_admin';

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS DA TABELA `admins`
-- ------------------------------------------------------------------------------

-- Leitura: cada um lê o seu registo; super_admin lê tudo (gestão de utilizadores).
DROP POLICY IF EXISTS "Admins read access" ON public.admins;
DROP POLICY IF EXISTS "Admins read own or super_admin" ON public.admins;
CREATE POLICY "Admins read own or super_admin"
  ON public.admins FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_super_admin());

-- Inserção: APENAS super_admin, e sempre via RPC `admin_grant_admin_access`
-- (que valida o papel e define role corretamente). Auto-registo eliminado.
DROP POLICY IF EXISTS "Super admins manage admins" ON public.admins;
DROP POLICY IF EXISTS "Super admins insert admins" ON public.admins;
CREATE POLICY "Super admins insert admins"
  ON public.admins FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Atualização: super_admin altera tudo; o próprio utilizador só altera campos
-- não privilegiados (nome, telefone, ultimo_acesso) — ver trigger abaixo.
DROP POLICY IF EXISTS "Super admins update admins" ON public.admins;
CREATE POLICY "Super admins update admins"
  ON public.admins FOR UPDATE
  TO authenticated
  USING (public.is_super_admin() OR id = auth.uid())
  WITH CHECK (public.is_super_admin() OR id = auth.uid());

-- 2.1 Trigger: impede não-super-admins de alterar campos privilegiados.
--     Permite updates de serviço (auth.uid() IS NULL, ex.: SQL Editor) e de
--     super_admin. auto-update só pode mexer em nome/telefone/ultimo_acesso.
CREATE OR REPLACE FUNCTION public.guard_admin_privileged_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Updates via service_role / SQL Editor (sem JWT de utilizador) passam.
  IF auth.uid() IS NULL OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- O master admin (adilson.dev@muf.ao) pode auto-sincronizar os seus
  -- privilégios via sync_admin_profile — é o mecanismo de recuperação
  -- já existente no schema (trigger em auth.users + RPC).
  IF lower(COALESCE(OLD.email, '')) = 'adilson.dev@muf.ao'
     OR lower(COALESCE(NEW.email, '')) = 'adilson.dev@muf.ao' THEN
    RETURN NEW;
  END IF;

  IF NEW.id IS DISTINCT FROM OLD.id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.papel IS DISTINCT FROM OLD.papel
     OR NEW.ativo IS DISTINCT FROM OLD.ativo THEN
    RAISE EXCEPTION 'not_authorized: campos privilegiados de admin';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_admin_privileged ON public.admins;
CREATE TRIGGER trg_guard_admin_privileged
  BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.guard_admin_privileged_fields();

-- 2.2 RPC: concede acesso admin a um utilizador já existente em auth.users.
--     Substitui o insert direto do frontend (que dependia do auto-registo).
CREATE OR REPLACE FUNCTION public.admin_grant_admin_access(
  p_user_id UUID,
  p_nome TEXT,
  p_email TEXT,
  p_papel TEXT DEFAULT 'gestor'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  IF p_papel NOT IN ('desenvolvedor', 'gestor', 'checkin') THEN
    RAISE EXCEPTION 'invalid_papel';
  END IF;

  v_role := CASE WHEN p_papel = 'desenvolvedor' THEN 'super_admin' ELSE 'admin' END;

  INSERT INTO public.admins (id, nome, email, papel, role, ativo, created_at)
  VALUES (
    p_user_id,
    p_nome,
    lower(p_email),
    p_papel,
    v_role,
    true,
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET nome = EXCLUDED.nome,
      email = EXCLUDED.email,
      papel = EXCLUDED.papel,
      role = EXCLUDED.role,
      ativo = true;

  RETURN jsonb_build_object('success', true, 'role', v_role);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_grant_admin_access(UUID, TEXT, TEXT, TEXT) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_grant_admin_access(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- ------------------------------------------------------------------------------
-- 3. app_settings — leitura pública restrita a whitelist
-- ------------------------------------------------------------------------------
-- O site público só precisa destas chaves (src/services/publicDataService.ts).
-- Tudo o resto (ex.: chave_pix_iban, instruções de pagamento internas) deixa de
-- ser legível por anon/authenticated não-admin.

DROP POLICY IF EXISTS "Qualquer pessoa pode ler configurações ativas" ON public.app_settings;
DROP POLICY IF EXISTS "Public read app_settings whitelist" ON public.app_settings;
DROP POLICY IF EXISTS "Authenticated read app_settings whitelist" ON public.app_settings;

CREATE POLICY "Public read app_settings whitelist"
  ON public.app_settings FOR SELECT
  TO anon
  USING (key IN (
    'inscricoes_abertas',
    'checkin_aberto',
    'vagas_totais',
    'whatsapp_group_link',
    'evento_titulo',
    'evento_data',
    'evento_horario',
    'evento_local'
  ));

-- Utilizadores autenticados não-admin veem a mesma whitelist; admins leem tudo
-- (coberto também pela policy FOR ALL existente, mantida por segurança).
CREATE POLICY "Authenticated read app_settings whitelist"
  ON public.app_settings FOR SELECT
  TO authenticated
  USING (
    public.is_admin_user()
    OR key IN (
      'inscricoes_abertas',
      'checkin_aberto',
      'vagas_totais',
      'whatsapp_group_link',
      'evento_titulo',
      'evento_data',
      'evento_horario',
      'evento_local'
    )
  );

-- ------------------------------------------------------------------------------
-- 4. RPCs DE CHECK-IN / DASHBOARD — verificação de admin obrigatória
-- ------------------------------------------------------------------------------
-- Todas são SECURITY DEFINER (contornam RLS). Sem o guard, qualquer conta
-- autenticada — e por defeito do Postgres, qualquer `anon` — podia executar.

-- 4.1 mark_checkin
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
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

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

-- 4.2 undo_checkin
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
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

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

-- 4.3 search_for_checkin (convertida de sql para plpgsql para permitir o guard)
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
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
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
END;
$$;

-- 4.4 get_checkin_stats
CREATE OR REPLACE FUNCTION public.get_checkin_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

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
  ) INTO v_result FROM counts;

  RETURN v_result;
END;
$$;

-- 4.5 get_checkin_report
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
END;
$$;

-- 4.6 get_dashboard_stats
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
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

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

-- 4.7 get_daily_registrations
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
    to_char(d::date, 'YYYY-MM-DD') AS date,
    to_char(d::date, 'Dy') AS day_of_week,
    COUNT(i.id) AS count
  FROM generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval) d
  LEFT JOIN public.inscricoes i ON date_trunc('day', i.created_at) = d::date
  GROUP BY d::date
  ORDER BY d::date ASC;
END;
$$;

-- ------------------------------------------------------------------------------
-- 5. PERMISSÕES FINAIS DAS RPCs
-- ------------------------------------------------------------------------------
-- Remove o EXECUTE implícito de PUBLIC/anon (default do Postgres) e garante
-- apenas `authenticated` (com o guard interno a fazer a validação real).

REVOKE ALL ON FUNCTION public.mark_checkin(UUID, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.undo_checkin(UUID, TEXT, TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.search_for_checkin(TEXT) FROM public, anon;
REVOKE ALL ON FUNCTION public.get_checkin_stats() FROM public, anon;
REVOKE ALL ON FUNCTION public.get_checkin_report() FROM public, anon;
REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM public, anon;
REVOKE ALL ON FUNCTION public.get_daily_registrations(INTEGER) FROM public, anon;

GRANT EXECUTE ON FUNCTION public.mark_checkin(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.undo_checkin(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_for_checkin(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_checkin_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_registrations(INTEGER) TO authenticated;

-- As RPCs públicas mantêm-se tal como estavam.
GRANT EXECUTE ON FUNCTION public.create_public_inscricao(
  TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, INTEGER, TEXT
) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_referrer_by_code(TEXT) TO anon, authenticated;
