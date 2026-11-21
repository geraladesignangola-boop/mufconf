-- ==============================================================================
-- 030. create_public_inscricao: duplicados cancelados não bloqueiam nova inscrição
--
-- Contexto: a verificação de duplicado por telefone_normalizado considerava
-- TODAS as inscrições, incluindo as com estado = 'cancelada'. Resultado: um
-- número cancelado ficava bloqueado para sempre ("Este e-mail já está
-- registado" no site, embora o bloqueio fosse por telefone).
--
-- Aplicar no SQL Editor do Supabase (ou via `supabase db push`).
-- ==============================================================================

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
  v_capacidade INTEGER;
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

  -- 3. Verificar duplicado por telefone normalizado (ignora canceladas)
  SELECT id, codigo INTO v_existing_id, v_existing_code
  FROM public.inscricoes
  WHERE telefone_normalizado = v_norm_phone
    AND estado <> 'cancelada'
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RAISE EXCEPTION 'duplicate_registration: %', v_existing_code;
  END IF;

  -- 4. Capacidade total de vagas (chave 'vagas_totais' em app_settings)
  SELECT COALESCE(NULLIF(value, '')::INTEGER, 350)
  INTO v_capacidade
  FROM public.app_settings
  WHERE key = 'vagas_totais';

  v_capacidade := COALESCE(v_capacidade, 350);

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
