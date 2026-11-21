-- ==============================================================================
-- 027. LISTAS EDITÁVEIS DO SITE — EIXOS TEMÁTICOS E COMPONENTES DA VISÃO
-- ==============================================================================
-- Os blocos "Componentes" (3 pilares) e "Eixos Temáticos & Resultados" da
-- secção Propósito (ModernaSobreParaQuem) deixam de estar fixos no código:
-- passam a viver em secoes_conteudo.conteudo_json.itens, geríveis no painel
-- admin (nova página "Listas de Conteúdo").
--
-- Formato normalizado de cada item:
--   { "numero": "01", "selo": "Liderança", "titulo": "...", "descricao": "..." }
--   - `selo` é opcional (usado apenas pelos eixos; nos componentes fica vazio)
--
-- Idempotente: ON CONFLICT (chave) DO NOTHING — não altera registos existentes.
-- ==============================================================================

-- 1. EIXOS TEMÁTICOS (bloco "02 · Eixos Temáticos & Resultados")
INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, conteudo_json, visivel, ordem)
VALUES (
  'eixos',
  'Eixos Temáticos & Resultados',
  'O que vais construir na conferência',
  '',
  '{"itens":[
    {"numero":"01","selo":"Liderança","titulo":"Liderança Feminina & Visão","descricao":"Capacitação prática e encorajamento para assumires posições de influência com clareza de propósito na família, na igreja e na sociedade."},
    {"numero":"02","selo":"Emocional","titulo":"Resiliência & Gestão Emocional","descricao":"Renovação da identidade e ferramentas concretas para lidar com pressões diárias, equilibrar trabalho, fé e fortalecer a saúde emocional."},
    {"numero":"03","selo":"Empreendedorismo","titulo":"Empreendedorismo & Impacto Comunitário","descricao":"Inovação, gestão responsável e conexões estratégicas com mulheres e organizações que constroem soluções reais em Angola."},
    {"numero":"04","selo":"Espiritual","titulo":"Vida Familiar & Fortalecimento Espiritual","descricao":"Ensino bíblico sólido voltado à restauração familiar, comunhão e aprofundamento na fé para viver o teu propósito diário."}
  ]}'::jsonb,
  true,
  2
)
ON CONFLICT (chave) DO NOTHING;

-- 2. COMPONENTES DA EXPERIÊNCIA (3 pilares da coluna direita da secção Visão)
INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, conteudo_json, visivel, ordem)
VALUES (
  'componentes',
  'Componentes da Experiência',
  '',
  '',
  '{"itens":[
    {"numero":"01","titulo":"Autoridade com vivência","descricao":"Ensino de preletoras e mentoras com experiência prática, partilhando princípios aplicáveis à realidade de mulheres em diversas áreas."},
    {"numero":"02","titulo":"Rede que permanece","descricao":"Acolhimento genuíno, criação de contactos profissionais e acompanhamento contínuo entre participantes e comunidades."},
    {"numero":"03","titulo":"Excelência na organização","descricao":"Pontualidade, conforto no Centro de Convenções Talatona e uma programação dinâmica do credenciamento ao encerramento."}
  ]}'::jsonb,
  true,
  1
)
ON CONFLICT (chave) DO NOTHING;
