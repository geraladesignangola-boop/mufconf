-- ==============================================================================
-- 032. LIMPEZA DE DADOS DE DEMONSTRAÇÃO (seeds da migration 015)
-- ------------------------------------------------------------------------------
-- A migration 015 inseriu registos fictícios de oradoras e programação
-- (Dra. Maria Santos, Pastora Ana Paula, Eng.ª Ruth Cardoso, etc.). O conteúdo
-- real é agora gerido pelo painel admin; estes registos demo não devem aparecer
-- no site público.
--
-- Em vez de DELETE, marcamos visivel = false: é reversível no admin e não
-- toca em registos que o administrador tenha entretanto editado ou criado
-- (o match é por nome/título exato do seed).
--
-- NOTA: parceiros e logos de parceiros NÃO são alterados — os valores semeados
-- (A-Design, Mediateca, Rádio Luanda Gospel, Centro de Convenções Talatona)
-- são entidades reais prováveis e estão sob gestão do admin.
-- Idempotente.
-- ==============================================================================

-- 1. Oradoras fictícias do seed
UPDATE public.oradoras
SET visivel = false
WHERE nome IN (
  'Dra. Maria Santos',
  'Pastora Ana Paula',
  'Eng.ª Ruth Cardoso'
);

-- 2. Itens fictícios do cronograma do seed
UPDATE public.programacao
SET visivel = false
WHERE titulo IN (
  'Credenciamento e Boas-Vindas',
  'Sessão de Abertura: Identidade e Propósito',
  'Pausa para Café e Networking',
  'Painel de Liderança e Gestão Emocional',
  'Oficina Prática de Propósito & Carreira',
  'Plenária de Clamor e Encerramento',
  'Registo Fotográfico e Despedida'
);
