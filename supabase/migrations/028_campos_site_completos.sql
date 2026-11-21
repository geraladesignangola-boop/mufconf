-- ==============================================================================
-- 028. TODOS OS TEXTOS FIXOS DO SITE PÚBLICO PASSAM A SER EDITÁVEIS NO ADMIN
-- ==============================================================================
-- Formato de conteudo_json por secção:
--   { "campos": { "chave": "texto" },          -- textos soltos (key → string)
--     "listas": { "chave": ["v=l", ...] },     -- opções "valor=etiqueta"
--     "itens":  [ {numero,titulo,selo,descricao} ] } -- listas estruturadas
--
-- Blocos cobertos: hero (slogan/marquee), navegação (marca + rótulos),
-- visão (citação), parcerias (cotas + dossier + formulário), logística
-- (parágrafo + etiquetas), inscrição (formulário + sucesso + bilhete),
-- footer (contactos + copyright), materiais já usa cartaz_oficial.descricao,
-- termos (secções da página /termos).
-- Idempotente: ON CONFLICT (chave) DO NOTHING.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- HERO — slogan fixo + 2 itens fixos do marquee
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = COALESCE(conteudo_json, '{}'::jsonb) || '{
  "campos": {"slogan": "“Desperte a sua essência, viva o seu propósito.”"},
  "listas": {"marquee_fixos": ["FORMATO PRESENCIAL", "ENTRADA GRATUITA"]}
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'hero'
  AND NOT (COALESCE(conteudo_json, '{}'::jsonb) ? 'campos');

-- ------------------------------------------------------------------------------
-- NAVEGAÇÃO — wordmark + rótulos do menu (novo registo)
-- ------------------------------------------------------------------------------
INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, conteudo_json, visivel, ordem)
VALUES (
  'navegacao',
  'Navegação do Site',
  '',
  '',
  '{"campos": {
    "marca": "MULHERES DE FOGO",
    "nav_visao": "Propósito",
    "nav_programacao": "Programação",
    "nav_oradoras": "Oradoras",
    "nav_parcerias": "Parcerias",
    "nav_logistica": "Acesso",
    "nav_galeria": "Galeria",
    "nav_materiais": "Materiais"
  }}'::jsonb,
  true,
  0
)
ON CONFLICT (chave) DO NOTHING;

-- ------------------------------------------------------------------------------
-- VISÃO — bloco "Tema Oficial" (citação + apoio)
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = COALESCE(conteudo_json, '{}'::jsonb) || '{
  "campos": {
    "selo_tema": "Tema Oficial 2026",
    "citacao": "“Desperte a sua essência, viva o seu propósito.”",
    "citacao_apoio": "Um espaço seguro e profissional para fortalecer a fé, a visão e o propósito de mulheres de diferentes áreas e comunidades."
  }
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'visao'
  AND NOT (COALESCE(conteudo_json, '{}'::jsonb) ? 'campos');

-- ------------------------------------------------------------------------------
-- PARCERIAS — cotas (itens) + secção de patrocínio + formulário de dossier
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = '{
  "campos": {
    "h2_titulo": "Apoie uma conferência que transforma mulheres e comunidades.",
    "h2_descricao": "Empresas e instituições podem associar a sua marca à conferência através das cotas indicativas abaixo.",
    "dossier_titulo": "Dossier Institucional",
    "dossier_subtitulo": "Solicitar dossier de patrocínio",
    "dossier_texto": "Indica os dados da organização para receberes a proposta completa pela comissão organizadora.",
    "lbl_empresa": "Empresa / Organização",
    "lbl_responsavel": "Responsável",
    "lbl_contacto": "Telefone / WhatsApp",
    "lbl_categoria": "Categoria de interesse",
    "lbl_mensagem": "Mensagem",
    "ph_empresa": "Nome da empresa ou instituição",
    "ph_responsavel": "Nome do contacto",
    "ph_contacto": "Ex: 923 000 000",
    "ph_mensagem": "Indica como a tua organização gostaria de participar...",
    "btn_dossier": "Solicitar Dossier de Patrocínio",
    "msg_sucesso": "Obrigado, {responsavel}. A comissão organizadora da conferência entrará em contacto em breve com os detalhes da cota {categoria}.",
    "btn_novo_pedido": "Enviar outro pedido",
    "pedido_registado": "Pedido de dossier registado"
  },
  "itens": [
    {"numero":"01","titulo":"Diamante","selo":"Patrocinador principal","descricao":"Destaque no cartaz oficial, stand exclusivo no local do evento e menção nas sessões plenárias."},
    {"numero":"02","titulo":"Ouro","selo":"Apoio institucional","descricao":"Logótipo em materiais impressos, projeção digital durante a programação e credenciamento especial."},
    {"numero":"03","titulo":"Prata","selo":"Parceiro de experiência","descricao":"Apoio direto aos kits de acolhimento, materiais de receção ou pausas para café e networking."}
  ]
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'parcerias';

-- ------------------------------------------------------------------------------
-- LOGÍSTICA — parágrafo + etiquetas dos dados do evento
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = '{
  "campos": {
    "paragrafo": "Participação gratuita com confirmação imediata até o limite de {vagas} vagas. Após atingir a capacidade, fica ativa a lista de espera.",
    "lbl_data": "Data",
    "lbl_horario": "Horário",
    "lbl_local": "Local",
    "lbl_capacidade": "Capacidade",
    "lbl_lote": "Lote atual",
    "formato_presencial": "Presencial",
    "formato_gratuito": "Gratuita"
  }
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'logistica'
  AND NOT (COALESCE(conteudo_json, '{}'::jsonb) ? 'campos');

-- ------------------------------------------------------------------------------
-- INSCRIÇÃO — formulário completo + estados de sucesso
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = '{
  "campos": {
    "lbl_nome": "Nome Completo",
    "ph_nome": "Escreve o teu nome completo",
    "lbl_whatsapp": "Telefone / WhatsApp",
    "ph_whatsapp": "Ex: 923 000 000",
    "lbl_email": "E-mail",
    "ph_email": "teu@email.com",
    "help_opcional": "Opcional",
    "lbl_igreja": "Igreja / Comunidade",
    "ph_igreja": "Nome da igreja ou comunidade",
    "lbl_municipio": "Município / Bairro",
    "ph_municipio": "Ex: Talatona, Maianga, Kilamba...",
    "lbl_faixa": "Faixa Etária",
    "lbl_como_soube": "Como soubeste do evento?",
    "lbl_recomendacao": "Recomendação / Como nos conheceste",
    "ph_recomendacao": "Ex: amiga Maria, pastor da igreja, flyer no centro comercial...",
    "lbl_expectativa": "O que esperas desta conferência?",
    "ph_expectativa": "Escreve o que esperas ganhar com esta experiência...",
    "lbl_observacoes": "Observações",
    "ph_observacoes": "Acessibilidade, necessidades especiais ou qualquer informação extra...",
    "termos_texto": "Confirmo a minha intenção de comparecer no local do evento e autorizo o contacto da comissão organizadora para envio do código de acesso.",
    "btn_enviando": "A Emitir Código de Acesso...",
    "btn_aberto": "Confirmar Inscrição Gratuita",
    "btn_fechado": "Entrar na Lista de Espera",
    "nota_confirmacao": "Confirmação imediata com código de acesso",
    "nota_vagas": "Registo presencial sujeito a vagas",
    "sucesso_eyebrow": "Confirmação Imediata",
    "sucesso_titulo": "Aqui está o teu bilhete.",
    "sucesso_texto": "Apresenta o QR Code no credenciamento{data}{local}.",
    "btn_exportar": "Exportar",
    "btn_exportando": "A exportar…",
    "btn_partilhar": "Partilhar",
    "btn_partilhado": "Link copiado",
    "btn_wa": "Partilhar no WhatsApp",
    "btn_outra": "Inscrever Outra Pessoa",
    "btn_preview": "Preview do Bilhete (temporário)",
    "aviso_convidada": "Foste convidada através de um link de partilha oficial.",
    "lbl_bilhete_nome": "Nome",
    "lbl_bilhete_telefone": "Telefone / WhatsApp",
    "lbl_bilhete_email": "E-mail",
    "lbl_bilhete_igreja": "Igreja / Comunidade",
    "lbl_bilhete_municipio": "Município",
    "lbl_bilhete_faixa": "Faixa Etária",
    "lbl_bilhete_numero": "Nº Inscrição"
  },
  "listas": {
    "opcoes_faixa": ["18-25=18–25 anos", "26-35=26–35 anos", "36-45=36–45 anos", "46+=46+ anos"],
    "opcoes_como_soube": ["Instagram=Instagram", "Facebook=Facebook", "Indicacao de amiga=Indicação de amiga", "Igreja=Igreja", "Outro=Outro"]
  }
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'inscricao'
  AND NOT (COALESCE(conteudo_json, '{}'::jsonb) ? 'campos');

-- ------------------------------------------------------------------------------
-- FOOTER — contactos, etiquetas e copyright
-- ------------------------------------------------------------------------------
UPDATE public.secoes_conteudo
SET conteudo_json = '{
  "campos": {
    "lbl_atendimento": "Atendimento & Organização",
    "lbl_ligacoes": "Ligações",
    "fone_display": "+244 932 583 167",
    "fone_href": "tel:+244932583167",
    "email_display": "geral@womanexperience.ao",
    "email_href": "mailto:geral@womanexperience.ao",
    "ig_url": "https://www.instagram.com/muf.mulheresdefogo/",
    "ig_label": "Instagram",
    "fb_url": "https://www.facebook.com/profile.php?id=61583199112349",
    "fb_label": "Facebook",
    "voltar_topo": "Voltar ao topo",
    "copyright": "© {ano} Conferência Explosão Profética Mulheres de Fogo — 2ª Edição · Talatona Shopping, Talatona, Luanda."
  }
}'::jsonb,
    atualizado_em = NOW()
WHERE chave = 'footer'
  AND NOT (COALESCE(conteudo_json, '{}'::jsonb) ? 'campos');

-- ------------------------------------------------------------------------------
-- TERMOS — secções da página /termos (itens) + e-mail de contacto
-- ------------------------------------------------------------------------------
INSERT INTO public.secoes_conteudo (chave, titulo, subtitulo, descricao, conteudo_json, visivel, ordem)
VALUES (
  'termos',
  'Termos de Participação & Política de Privacidade',
  '',
  '',
  '{
    "campos": {"email_contacto": "geral@womanexperience.ao"},
    "itens": [
      {"numero":"1.","titulo":"Sobre o Evento","descricao":"A conferência é um evento de mulheres organizado pelo Ministério Mulheres de Fogo. A data, o horário e o local constam na página principal do site."},
      {"numero":"2.","titulo":"Inscrição","descricao":"Ao inscrever-se no evento, o utilizador declara que: tem 18 anos ou mais; forneceu informações verdadeiras e exatas; deseja comparecer voluntariamente ao evento; autoriza o contacto via WhatsApp e chamadas telefónicas para fins relacionados ao evento."},
      {"numero":"3.","titulo":"Dados Pessoais","descricao":"Os dados pessoais recolhidos (nome, email, telefone, WhatsApp, morada) são utilizados exclusivamente para gestão de inscrições, contacto de suporte e envio de notificações relacionadas com o evento. Os dados não são partilhados com terceiros para fins de marketing."},
      {"numero":"4.","titulo":"Sistema de Referrals","descricao":"O sistema de referrals é voluntário. Ao partilhar o seu link exclusivo, o utilizador autoriza que o seu nome seja exibido publicamente no ranking de convidadoras. O pódio final é apurado pelo total de convidadas no encerramento da campanha e os prémios são entregues presencialmente no dia do evento."},
      {"numero":"5.","titulo":"Cancelamento","descricao":"O utilizador pode solicitar a remoção dos seus dados pessoais contactando o email de contacto indicado. A remoção será processada em até 7 dias úteis."},
      {"numero":"6.","titulo":"Contacto","descricao":"Para questões sobre privacidade ou dados pessoais, contacta a comissão organizadora pelo email indicado."}
    ]
  }'::jsonb,
  true,
  10
)
ON CONFLICT (chave) DO NOTHING;
