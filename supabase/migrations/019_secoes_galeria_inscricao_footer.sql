-- ==============================================================================
-- 019. SECÇÕES EM FALTA NO MÓDULO "CONTEÚDO DO SITE"
-- ==============================================================================
-- O site público (ModernaPage) apresenta três blocos que não tinham registo
-- na tabela secoes_conteudo e, por isso, não apareciam no painel admin:
--   * galeria   — secção "08 · Acervo & Memórias" (ModernaGaleria)
--   * inscricao — bloco "07 · Inscrição e Acesso" (ModernaLogisticaInscricao)
--   * footer    — rodapé institucional (ModernaPage)
--
-- Estes INSERTs são idempotentes: correr novamente não duplica nem altera
-- textos já personalizados pelo administrador.

INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, visivel, ordem)
VALUES
  (
    'galeria',
    'Acervo & Memórias',
    'A atmosfera que nos une',
    'Momentos marcantes de adoração, capacitação e comunhão registados em edições anteriores da conferência.',
    true,
    7
  ),
  (
    'inscricao',
    'Inscrição e Acesso',
    'Garante a Tua Vaga',
    'Formulário público de registo, validação de vagas e emissão do código de acesso com QR Code.',
    true,
    8
  ),
  (
    'footer',
    'CONFERÊNCIA MULHERES DE FOGO 2026',
    '“Desperte a sua essência, viva o seu propósito.”',
    'Via A1, Talatona, Luanda, Angola · Centro de Convenções Talatona',
    true,
    9
  )
ON CONFLICT (chave) DO NOTHING;
