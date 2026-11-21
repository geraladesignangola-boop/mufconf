-- ==============================================================================
-- 024. ATALHOS FIXOS DO SITE COMO ITENS GERÍVEIS (Materiais & Atalhos)
-- ==============================================================================
-- "Abrir no Mapa" e "Falar com Organização" deixam de estar fixos no código:
-- passam a ser linhas da tabela materiais_atalhos, geríveis no painel admin.
-- O link do grupo de WhatsApp mantém-se dinâmico (app_settings) porque já é
-- editado em Definições. Idempotente: não duplica registos existentes.

INSERT INTO public.materiais_atalhos (tipo, titulo, descricao, url, ordem, visivel)
SELECT 'atalho', 'Abrir no Mapa', 'Localização do evento no Google Maps',
  'https://maps.google.com/?q=Centro+de+Conven%C3%A7%C3%B5es+Talatona+Via+A1+Luanda+Angola',
  90, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.materiais_atalhos WHERE url LIKE 'https://maps.google.com/%'
);

INSERT INTO public.materiais_atalhos (tipo, titulo, descricao, url, ordem, visivel)
SELECT 'atalho', 'Falar com Organização', 'Contacta a equipa do evento pelo WhatsApp',
  'https://wa.me/?text=Ol%C3%A1!%20Gostaria%20de%20mais%20informa%C3%A7%C3%B5es%20sobre%20o%20evento.',
  91, true
WHERE NOT EXISTS (
  SELECT 1 FROM public.materiais_atalhos WHERE url LIKE 'https://wa.me/?text=%'
);
