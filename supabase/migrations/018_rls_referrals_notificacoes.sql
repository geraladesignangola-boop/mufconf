-- ==============================================================================
-- 018: RLS NAS TABELAS DE VIRALIDADE, PREMIAÇÃO E NOTIFICAÇÕES
-- ------------------------------------------------------------------------------
-- As tabelas `referrals`, `referral_links`, `referral_link_clicks`,
-- `prize_claims` e `notifications` foram criadas na migração 015 sem
-- ROW LEVEL SECURITY, o que permitia leitura/escrita anónima com a anon key.
--
-- Esta migração:
--   * ativa RLS e concede acesso total aos administradores (tabela `admins`);
--   * mantém os fluxos públicos a funcionar (inscrições e tracking de cliques)
--     recorrendo às RPCs SECURITY DEFINER já existentes e a políticas
--     explícitas de registo de cliques;
--   * restringe notificações e prémios (dados operacionais) a admins.
--
-- NOTA: as RPCs `log_referral_link_click`, `admin_generate_referral_link`,
-- `assign_podium_prizes` e `get_referral_ranking` são usadas pelo frontend mas
-- não estão versionadas no repositório (faltam as migrações 001-013). Assim que
-- forem versionadas, as políticas anónimas de `referral_links` /
-- `referral_link_clicks` devem ser reapertadas.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. NOTIFICAÇÕES — apenas admins (leitura e escrita)
-- ------------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerem notificações" ON public.notifications;
CREATE POLICY "Admins gerem notificações"
  ON public.notifications FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 2. PRÉMIOS (prize_claims) — leitura/escrita apenas de admins;
--    a atribuição é feita pela RPC assign_podium_prizes (SECURITY DEFINER).
-- ------------------------------------------------------------------------------
ALTER TABLE public.prize_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerem prémios" ON public.prize_claims;
CREATE POLICY "Admins gerem prémios"
  ON public.prize_claims FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 3. INDICAÇÕES (referrals) — escrita pela RPC create_public_inscricao
--    (SECURITY DEFINER, verificada na migração 015) e leitura pelo painel.
-- ------------------------------------------------------------------------------
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem indicações" ON public.referrals;
CREATE POLICY "Admins leem indicações"
  ON public.referrals FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

-- ------------------------------------------------------------------------------
-- 4. LINKS DE INDICAÇÃO (referral_links)
--    * admins: gestão total;
--    * anónimos: apenas UPDATE para que a contagem de cliques possa ser
--      incrementada pela RPC pública de tracking (enquanto essa RPC não estiver
--      versionada no repositório). Criação e leitura continuam a ser feitas
--      pelas RPCs SECURITY DEFINER.
-- ------------------------------------------------------------------------------
ALTER TABLE public.referral_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins gerem links de indicação" ON public.referral_links;
CREATE POLICY "Admins gerem links de indicação"
  ON public.referral_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Contagem de cliques pública" ON public.referral_links;
CREATE POLICY "Contagem de cliques pública"
  ON public.referral_links FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 5. CLIQUES (referral_link_clicks)
--    * admins: leitura/apagamento;
--    * anónimos: apenas INSERT (registo de clique vindo do site público).
-- ------------------------------------------------------------------------------
ALTER TABLE public.referral_link_clicks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins leem cliques" ON public.referral_link_clicks;
CREATE POLICY "Admins leem cliques"
  ON public.referral_link_clicks FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Registo público de cliques" ON public.referral_link_clicks;
CREATE POLICY "Registo público de cliques"
  ON public.referral_link_clicks FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
