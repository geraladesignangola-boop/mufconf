-- Migration 014: Criar tabela de admins e adicionar adilson.dev@muf.ao como super_admin
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 1. Garantir que a tabela public.admins existe
CREATE TABLE IF NOT EXISTS public.admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Politica para que o admin consiga ler o seu proprio registo
DROP POLICY IF EXISTS "Admins read own row" ON public.admins;
CREATE POLICY "Admins read own row" ON public.admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Funcao de verificacao de admin
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
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM public;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

-- 2. Associar o utilizador ja registado em auth.users a tabela public.admins como super_admin
DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'adilson.dev@muf.ao';
  v_nome TEXT := 'Adilson Dev';
BEGIN
  -- Buscar o ID do utilizador ja registado no Supabase Auth
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = lower(v_email)
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Utilizador % nao encontrado no auth.users! Verifica se o email foi criado em Authentication > Users.', v_email;
  END IF;

  -- Inserir ou atualizar na tabela public.admins
  INSERT INTO public.admins (id, nome, email, role, created_at)
  VALUES (
    v_user_id,
    COALESCE((SELECT raw_user_meta_data->>'nome' FROM auth.users WHERE id = v_user_id), v_nome),
    lower(v_email),
    'super_admin',
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'super_admin',
    email = EXCLUDED.email,
    nome = EXCLUDED.nome;

  RAISE NOTICE 'Sucesso! O utilizador % (ID: %) foi adicionado como Admin Master (super_admin).', v_email, v_user_id;
END $$;

-- 3. Trigger para manter sincronizado caso o utilizador seja alterado no Auth
CREATE OR REPLACE FUNCTION public.handle_sync_master_admin()
RETURNS trigger AS $$
BEGIN
  IF lower(NEW.email) = 'adilson.dev@muf.ao' THEN
    INSERT INTO public.admins (id, nome, email, role, created_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'nome', 'Adilson Dev'),
      lower(NEW.email),
      'super_admin',
      NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
      role = 'super_admin',
      email = EXCLUDED.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_master_admin ON auth.users;
CREATE TRIGGER trg_sync_master_admin
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_sync_master_admin();
