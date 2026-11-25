-- =============================================================================
-- 034. Tracking público de cliques usado pelos gráficos do painel
-- =============================================================================
-- O frontend já chama log_referral_link_click, mas a implementação não estava
-- versionada neste repositório. Esta RPC grava o evento diário e incrementa os
-- contadores agregados consumidos pelo gráfico de canais.

DROP FUNCTION IF EXISTS public.log_referral_link_click(TEXT, TEXT, TEXT);

CREATE FUNCTION public.log_referral_link_click(
  ref_code TEXT,
  p_source TEXT DEFAULT 'direct',
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id UUID;
  v_participant_id UUID;
  v_source TEXT;
BEGIN
  IF ref_code IS NULL OR length(trim(ref_code)) < 3 OR length(trim(ref_code)) > 160 THEN
    RETURN jsonb_build_object('success', false);
  END IF;

  v_source := lower(trim(COALESCE(p_source, 'direct')));
  IF v_source NOT IN ('whatsapp', 'facebook', 'instagram') THEN
    v_source := 'direct';
  END IF;

  -- Links criados pelo painel usam referral_links.token.
  SELECT l.id, l.participant_id
    INTO v_link_id, v_participant_id
  FROM public.referral_links l
  WHERE l.token = trim(ref_code)
  LIMIT 1;

  -- Também aceita o código principal da inscrita. Cria o registo do link de
  -- forma preguiçosa caso uma inscrição antiga ainda não tenha referral_link.
  IF v_link_id IS NULL THEN
    SELECT i.id
      INTO v_participant_id
    FROM public.inscricoes i
    WHERE i.referral_code = trim(ref_code)
      AND i.estado <> 'cancelada'
    LIMIT 1;

    IF v_participant_id IS NULL THEN
      RETURN jsonb_build_object('success', false);
    END IF;

    INSERT INTO public.referral_links (participant_id, token, label, source)
    VALUES (v_participant_id, trim(ref_code), 'Link principal', 'share')
    ON CONFLICT (token) DO NOTHING;

    SELECT l.id, l.participant_id
      INTO v_link_id, v_participant_id
    FROM public.referral_links l
    WHERE l.token = trim(ref_code)
    LIMIT 1;
  END IF;

  INSERT INTO public.referral_link_clicks (
    referral_link_id,
    participant_id,
    source,
    user_agent
  )
  VALUES (
    v_link_id,
    v_participant_id,
    v_source,
    NULLIF(left(COALESCE(p_user_agent, ''), 500), '')
  );

  UPDATE public.referral_links
  SET total_clicks = COALESCE(total_clicks, 0) + 1,
      whatsapp_clicks = COALESCE(whatsapp_clicks, 0) + CASE WHEN v_source = 'whatsapp' THEN 1 ELSE 0 END,
      facebook_clicks = COALESCE(facebook_clicks, 0) + CASE WHEN v_source = 'facebook' THEN 1 ELSE 0 END,
      instagram_clicks = COALESCE(instagram_clicks, 0) + CASE WHEN v_source = 'instagram' THEN 1 ELSE 0 END,
      direct_clicks = COALESCE(direct_clicks, 0) + CASE WHEN v_source = 'direct' THEN 1 ELSE 0 END
  WHERE id = v_link_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.log_referral_link_click(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_referral_link_click(TEXT, TEXT, TEXT) TO anon, authenticated;

-- Recupera a distribuição por canal para eventos que já existam na tabela,
-- sem reduzir contadores agregados históricos.
WITH cliques AS (
  SELECT
    referral_link_id,
    COUNT(*) AS total,
    COUNT(*) FILTER (WHERE lower(source) = 'whatsapp') AS whatsapp,
    COUNT(*) FILTER (WHERE lower(source) = 'facebook') AS facebook,
    COUNT(*) FILTER (WHERE lower(source) = 'instagram') AS instagram,
    COUNT(*) FILTER (WHERE source IS NULL OR lower(source) NOT IN ('whatsapp', 'facebook', 'instagram')) AS direct
  FROM public.referral_link_clicks
  GROUP BY referral_link_id
)
UPDATE public.referral_links l
SET total_clicks = GREATEST(COALESCE(l.total_clicks, 0), c.total),
    whatsapp_clicks = GREATEST(COALESCE(l.whatsapp_clicks, 0), c.whatsapp),
    facebook_clicks = GREATEST(COALESCE(l.facebook_clicks, 0), c.facebook),
    instagram_clicks = GREATEST(COALESCE(l.instagram_clicks, 0), c.instagram),
    direct_clicks = GREATEST(
      COALESCE(l.direct_clicks, 0),
      c.direct + GREATEST(COALESCE(l.total_clicks, 0) - c.total, 0)
    )
FROM cliques c
WHERE l.id = c.referral_link_id;

-- A tabela referral_link_clicks guarda o dia exato; o gráfico agrega por dia
-- segundo o fuso do evento e apresenta abreviaturas em português.
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
DECLARE
  v_days INTEGER := LEAST(GREATEST(COALESCE(p_days, 7), 1), 90);
  v_today DATE := (CURRENT_TIMESTAMP AT TIME ZONE 'Africa/Luanda')::DATE;
BEGIN
  IF NOT public.is_admin_user() THEN
    RAISE EXCEPTION 'not_authorized';
  END IF;

  RETURN QUERY
  SELECT
    to_char(d::date, 'YYYY-MM-DD') AS data_col,
    CASE EXTRACT(DOW FROM d::date)::INTEGER
      WHEN 0 THEN 'Dom'
      WHEN 1 THEN 'Seg'
      WHEN 2 THEN 'Ter'
      WHEN 3 THEN 'Qua'
      WHEN 4 THEN 'Qui'
      WHEN 5 THEN 'Sex'
      ELSE 'Sáb'
    END AS dia_col,
    COUNT(c.id) AS total_col,
    COUNT(c.id) FILTER (WHERE c.source = 'whatsapp') AS whatsapp_col,
    COUNT(c.id) FILTER (WHERE c.source = 'facebook') AS facebook_col,
    COUNT(c.id) FILTER (WHERE c.source = 'instagram') AS instagram_col,
    COUNT(c.id) FILTER (WHERE c.source NOT IN ('whatsapp', 'facebook', 'instagram') OR c.source IS NULL) AS direct_col
  FROM generate_series(
    (v_today - (v_days - 1))::TIMESTAMP,
    v_today::TIMESTAMP,
    INTERVAL '1 day'
  ) AS d
  LEFT JOIN public.referral_link_clicks c
    ON (c.clicked_at AT TIME ZONE 'Africa/Luanda')::DATE = d::DATE
  GROUP BY d::DATE
  ORDER BY d::DATE ASC;
END;
$$;

REVOKE ALL ON FUNCTION public.get_daily_clicks(INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_daily_clicks(INTEGER) TO authenticated;
