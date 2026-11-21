-- ==============================================================================
-- 026. APLICAÇÃO DAS RESPOSTAS DO QUESTIONÁRIO — CONTEÚDOS DO SITE PÚBLICO
-- ==============================================================================
-- Aplica os valores aprovados no questionário QUESTIONARIO_CAMPOS_SITE.md:
--   * app_settings  — evento_local (Talatona Shopping) e evento_titulo (2.ª Edição)
--   * secoes_conteudo — títulos, subtítulos e descrições das 10 secções públicas
--   * cartaz_oficial — título do cartaz ativo
--
-- Itens "Pendente" do questionário NÃO são alterados:
--   link do grupo WhatsApp, cronograma, oradoras, parceiros, logos,
--   galeria e ficheiros de materiais (sem dados aprovados).
--
-- Idempotente: pode correr várias vezes sem duplicar nem estragar dados.
-- Aplicar no SQL Editor do Supabase (ou `supabase db push`).
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. APP_SETTINGS — Definições do evento
--    (1.1 inscrições abertas, 1.2 vagas, 1.3 data, 1.4 horário → sem alteração)
-- ------------------------------------------------------------------------------
UPDATE public.app_settings
SET value = 'Talatona Shopping, Talatona, Luanda, Angola',
    updated_at = NOW()
WHERE key = 'evento_local';

UPDATE public.app_settings
SET value = 'Conferência Explosão Profética Mulheres de Fogo — 2.ª Edição',
    updated_at = NOW()
WHERE key = 'evento_titulo';

-- Mantém a tabela `eventos` coerente com o local definido nas definições
-- (mesma lógica de sincronização usada pelo painel admin).
UPDATE public.eventos
SET local_nome = 'Talatona Shopping, Talatona, Luanda, Angola',
    atualizado_em = NOW()
WHERE id IN (
  SELECT id FROM public.eventos
  ORDER BY criado_em DESC
  LIMIT 1
);

-- ------------------------------------------------------------------------------
-- 2. SECOES_CONTEUDO — textos aprovados por secção
--    Apenas colunas respondidas no questionário são atualizadas.
-- ------------------------------------------------------------------------------

-- 2.1 hero
UPDATE public.secoes_conteudo SET
  titulo = 'CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2.ª EDIÇÃO',
  subtitulo = 'Explosão Profética',
  descricao = 'A Conferência Explosão Profética Mulheres de Fogo reúne mulheres para um tempo de fé, adoração, ministração da Palavra, comunhão e fortalecimento espiritual. É uma ocasião para renovar convicções, aprofundar a relação com Deus e encorajar cada participante a viver com identidade e propósito.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'hero';

-- 2.2 visao
UPDATE public.secoes_conteudo SET
  titulo = 'O Propósito da Conferência',
  subtitulo = 'Despertar mulheres para uma vida com identidade, visão e propósito.',
  descricao = 'O Ministério Mulheres de Fogo promove encontros que procuram fortalecer a mulher na sua fé, identidade e propósito. A conferência é uma oportunidade de comunhão, ministração da Palavra e edificação espiritual, encorajando cada participante a aprofundar a sua caminhada com Deus e a assumir, com responsabilidade, o seu papel na família, na igreja e na sociedade.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'visao';

-- 2.3 programacao
UPDATE public.secoes_conteudo SET
  titulo = 'Cronograma Geral',
  subtitulo = 'Um dia de conferência, comunhão e edificação espiritual.',
  descricao = 'A programação da conferência contempla momentos de recepção, louvor, ministração da Palavra e comunhão. Os horários, as participações e a sequência das actividades deverão seguir o programa aprovado pela coordenação.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'programacao';

-- 2.4 oradoras
UPDATE public.secoes_conteudo SET
  titulo = 'Prelectoras e Convidadas',
  subtitulo = 'Vozes, experiências e perspectivas que edificam.',
  descricao = 'A conferência reúne convidadas com experiências e percursos distintos para partilhar mensagens, conhecimentos e testemunhos relevantes para o crescimento e fortalecimento das participantes. Os nomes e as apresentações públicas devem corresponder apenas às participações confirmadas pela organização.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'oradoras';

-- 2.5 parcerias
UPDATE public.secoes_conteudo SET
  titulo = 'Parceiros e Patrocinadores',
  subtitulo = 'Juntos, tornamos esta iniciativa possível.',
  descricao = 'A conferência conta com a colaboração de pessoas, empresas e instituições que reconhecem a importância de investir no desenvolvimento da mulher e de apoiar iniciativas com impacto espiritual, pessoal e social. A identificação pública dos parceiros será feita após a confirmação formal de cada apoio.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'parcerias';

-- 2.6 logistica (descrição não é renderizada no site — não é alterada)
UPDATE public.secoes_conteudo SET
  titulo = 'Localização & Acesso',
  subtitulo = 'Tudo preparado para te receber.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'logistica';

-- 2.7 inscricao
UPDATE public.secoes_conteudo SET
  titulo = 'Inscrição e Participação',
  subtitulo = 'Garante a Tua Vaga',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'inscricao';

-- 2.8 materiais
UPDATE public.secoes_conteudo SET
  titulo = 'Materiais & Atalhos',
  subtitulo = 'Tudo o que precisas num só lugar',
  descricao = 'Acede às informações e aos materiais oficiais da conferência. Consulta os conteúdos disponibilizados pela organização e utiliza os atalhos para obter orientações e entrar em contacto com a equipa responsável.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'materiais';

-- 2.9 galeria
UPDATE public.secoes_conteudo SET
  titulo = 'Acervo & Memórias',
  subtitulo = 'A atmosfera que nos une',
  descricao = 'Registos de encontros, actividades e momentos marcantes da caminhada do Mulheres de Fogo. Uma memória visual das experiências, das pessoas e das histórias que fazem parte desta comunidade.',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'galeria';

-- 2.10 footer
UPDATE public.secoes_conteudo SET
  titulo = 'CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2.ª EDIÇÃO',
  subtitulo = '“Desperte a sua essência, viva o seu propósito.”',
  descricao = 'Talatona Shopping, Talatona, Luanda, Angola',
  visivel = true,
  atualizado_em = NOW()
WHERE chave = 'footer';

-- ------------------------------------------------------------------------------
-- 3. CARTAZ_OFICIAL — título do cartaz ativo (8.1)
--    (8.2 imagem e 8.3 ativo → sem alteração: ficheiro pendente)
-- ------------------------------------------------------------------------------
UPDATE public.cartaz_oficial
SET titulo = 'Cartaz Oficial — Conferência Explosão Profética Mulheres de Fogo — 2.ª Edição',
    atualizado_em = NOW()
WHERE ativo = true
  AND titulo IS DISTINCT FROM 'Cartaz Oficial — Conferência Explosão Profética Mulheres de Fogo — 2.ª Edição';
