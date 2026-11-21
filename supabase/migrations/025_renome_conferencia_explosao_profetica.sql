-- ==============================================================================
-- 025. RENOMEAÇÃO OFICIAL DA CONFERÊNCIA
-- ==============================================================================
-- Novo nome: "Conferência Explosão Profética Mulheres de Fogo" — 2ª Edição
--
-- Atualiza os locais onde o nome antigo ("Conferência Mulheres de Fogo 2026")
-- estava guardado na base de dados:
--   * secoes_conteudo — títulos das secções "hero" e "footer" do site público
--   * app_settings    — chave "evento_titulo"
--   * eventos         — título do evento oficial (+ default da coluna)
--   * cartaz_oficial  — título do cartaz
--
-- As expressões WHERE só apanham linhas com o nome antigo, para não
-- sobrescrever títulos já personalizados pelo administrador.
-- Migração idempotente: correr de novo não altera nada.

-- ------------------------------------------------------------------------------
-- 1. Secções do site público (ModernaPage / ModernaHero)
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET titulo = 'CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2ª EDIÇÃO',
    atualizado_em = NOW()
WHERE chave IN ('hero', 'footer')
  AND titulo IS DISTINCT FROM 'CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2ª EDIÇÃO'
  AND titulo ILIKE '%MULHERES DE FOGO%';

-- ------------------------------------------------------------------------------
-- 2. Definições da aplicação (evento_titulo)
-- ------------------------------------------------------------------------------
UPDATE public.app_settings
SET value = 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição',
    updated_at = NOW()
WHERE key = 'evento_titulo'
  AND value IS DISTINCT FROM 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
  AND value ILIKE '%Mulheres de Fogo%';

-- ------------------------------------------------------------------------------
-- 3. Evento oficial
-- ------------------------------------------------------------------------------
UPDATE public.eventos
SET titulo = 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição',
    atualizado_em = NOW()
WHERE titulo IS DISTINCT FROM 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
  AND titulo ILIKE '%Mulheres de Fogo%';

ALTER TABLE public.eventos
  ALTER COLUMN titulo SET DEFAULT 'Conferência Explosão Profética Mulheres de Fogo — 2ª Edição';

-- ------------------------------------------------------------------------------
-- 4. Cartaz oficial (preserva o prefixo "Cartaz Oficial — ")
-- ------------------------------------------------------------------------------
UPDATE public.cartaz_oficial
SET titulo = 'Cartaz Oficial — Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
WHERE titulo IS DISTINCT FROM 'Cartaz Oficial — Conferência Explosão Profética Mulheres de Fogo — 2ª Edição'
  AND titulo ILIKE '%Mulheres de Fogo%';
