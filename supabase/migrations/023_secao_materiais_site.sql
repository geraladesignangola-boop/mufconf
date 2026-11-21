-- ==============================================================================
-- 023. SECÇÃO "MATERIAIS & ATALHOS" NO CONTEÚDO DO SITE
-- ==============================================================================
-- Regista a nova secção pública "08 · Materiais & Atalhos"
-- (ModernaMateriaisAtalhos) na tabela secoes_conteudo, para que o painel
-- admin (Conteúdo Site) possa editar textos e visibilidade.
-- Idempotente: correr novamente não altera textos já personalizados.

INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, visivel, ordem)
VALUES
  (
    'materiais',
    'Materiais & Atalhos',
    'Tudo o que precisas num só lugar',
    'Documentos oficiais para descarregar e ligações rápidas para acompanhar o evento.',
    true,
    8
  )
ON CONFLICT (chave) DO NOTHING;
