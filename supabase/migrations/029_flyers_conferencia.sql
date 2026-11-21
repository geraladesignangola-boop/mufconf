-- ==============================================================================
-- 029. SECÇÃO PÚBLICA "FLYERS DA CONFERÊNCIA"
-- ==============================================================================
-- Os flyers são geridos na secção pública "Galeria" do admin com a categoria
-- "Flyers" (tabela galeria). Esta migration apenas regista os textos da nova
-- secção em secoes_conteudo para poder ser editada em Conteúdo Site.
-- Idempotente: ON CONFLICT (chave) DO NOTHING.

INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, visivel, ordem)
VALUES (
  'flyers',
  'Flyers da Conferência',
  'Material gráfico oficial',
  'Flyers e visuais oficiais da conferência para partilha e impressão.',
  true,
  5
)
ON CONFLICT (chave) DO NOTHING;
