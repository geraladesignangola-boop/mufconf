# Questionário — Campos Editáveis do Site Público (via Painel Admin)

> **Objetivo:** recolher os valores finais de todos os conteúdos que o administrador pode alterar no painel (`/admin`) e que aparecem no site público (`/` — landing Moderna).
>
> **Como usar:** preenche a coluna **"Resposta / Valor final"** de cada pergunta. Deixa em branco o que deve manter o valor atual. Campos marcados com ⚠️ têm observações importantes.

Legenda de tipos: `texto` · `texto longo` · `imagem` · `ligação (URL)` · `sim/não` · `número` · `seleção`

---

## 1. Definições da Campanha (`/admin` → Definições + Ingressos e Vagas)

Estes campos alimentam o hero, a faixa de informações da inscrição e o formulário público.

| # | Pergunta | Tipo | Onde aparece no site | Valor atual | Resposta / Valor final |
|---|----------|------|----------------------|-------------|------------------------|
| 1.1 | Quais são as **inscrições abertas ou fechadas**? | sim/não | Botão "Garantir Vaga" ↔ "Lista de Espera"; formulário fica bloqueado quando fechado | Abertas | |
| 1.2 | Qual a **capacidade total de vagas**? | número | Hero (marquee "N VAGAS"), bloco Logística ("Capacidade · N vagas"), cabeçalho do formulário | 350 | |
| 1.3 | Qual a **data do evento** (formato livre, ex.: "5 de Dezembro de 2026")? | texto | Hero (marquee) + Logística (linha "Data") | "5 de Dezembro de 2026" | |
| 1.4 | Qual o **horário do evento** (ex.: "08h00 às 20h00")? | texto | Hero (marquee) + Logística (linha "Horário") | "08h00 às 20h00" | |
| 1.5 | Qual o **local do evento**? | texto | Hero (marquee) + Logística (linha "Local") | "Centro de Convenções Talatona, Luanda" | |
| 1.6 | Qual o **link do grupo de WhatsApp**? | ligação | Cartão "Entrar no Grupo de WhatsApp" em Materiais & Atalhos | placeholder `chat.whatsapp.com/Exemplo...` ⚠️ definir o real | |
| 1.7 | Qual o **título oficial do evento** (`evento_titulo`)? | texto | Lido pela app, mas o hero usa antes o título da secção `hero` — só aparece se `hero.titulo` estiver vazio | "Conferência Explosão Profética Mulheres de Fogo — 2ª Edição" | |

---

## 2. Conteúdo do Site — textos e visibilidade por secção (`/admin` → Conteúdo do Site)

Cada secção tem **Título**, **Subtítulo** e **Descrição**, mais um interruptor **Ativa/Ocultada** que esconde a secção **e** o respetivo link no menu de navegação.

### 2.1 Secção `hero` (Topo da página)

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.1.1 | Título principal (linha pequena do topo)? | texto | H1 em maiúsculas + faixa marquee | "CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2ª EDIÇÃO" | |
| 2.1.2 | Subtítulo em destaque (grande, degradê)? | texto | Palavra/frase gigante sob o título (a ligadura "LO" é estilizada automaticamente se existir) | "Explosão Profética" | |
| 2.1.3 | Descrição/manifesto sob o título? | texto longo | Parágrafo de apoio acima do botão "Garantir Vaga" | "Uma conferência presencial centrada em fé, identidade, propósito…" | |
| 2.1.4 | Secção visível? | sim/não | Esconde todo o hero | Sim | |

> ⚠️ A frase "Desperte a sua essência, viva o seu propósito." está **fixa no código** (não editável aqui).

### 2.2 Secção `visao` (Propósito — "01 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.2.1 | Título (selo "01 · …")? | texto | Etiqueta acima do H2 | "O Propósito da Imersão" | |
| 2.2.2 | Subtítulo (H2)? | texto | "Três pilares que sustentam este encontro." | "Porquê Mulheres de Fogo?" | |
| 2.2.3 | Descrição? | texto longo | Parágrafo sob o H2 (opcional — se vazio não aparece) | "Uma experiência imersiva desenhada para destravar…" | |
| 2.2.4 | Secção visível? | sim/não | Esconde secção + link "Propósito" | Sim | |

> ⚠️ Os blocos "3 componentes" (Autoridade com vivência / Rede que permanece / Excelência) e os 4 eixos temáticos (Liderança, Emocional, Empreendedorismo, Espiritual) são **fixos no código** — não são editáveis pelo admin.

### 2.3 Secção `programacao` (Cronograma — "03 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.3.1 | Título (selo "03 · …")? | texto | Etiqueta acima do H2 | "Cronograma Geral" | |
| 2.3.2 | Subtítulo (H2)? | texto | "Um dia inteiro de imersão e capacitação" | "O Teu Dia de Transformação" | |
| 2.3.3 | Descrição? | texto longo | Parágrafo de apoio | "Uma jornada completa de 12 horas…" | |
| 2.3.4 | Secção visível? | sim/não | Esconde secção + link "Programação" | Sim | |

### 2.4 Secção `oradoras` (Preletoras — "04 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.4.1 | Título (selo "04 · …")? | texto | Etiqueta acima do H2 | "Preletoras e Mentoras" | |
| 2.4.2 | Subtítulo (H2)? | texto | "Vozes de autoridade e vivência" | "Vozes que Inspiram Nações" | |
| 2.4.3 | Descrição? | texto longo | Texto à direita do cabeçalho | "Mulheres de comprovado testemunho…" | |
| 2.4.4 | Secção visível? | sim/não | Esconde secção + link "Oradoras" | Sim | |

### 2.5 Secção `parcerias` (Parceiros — "05 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.5.1 | Título (selo do marquee de logos)? | texto | Etiqueta acima do H2 da faixa de logos | "Rede de Parceiros" | |
| 2.5.2 | Subtítulo (H2)? | texto | "Quem caminha connosco" | "Quem caminha connosco" | |
| 2.5.3 | Descrição? | texto longo | Parágrafo à direita do H2 | "Instituições e marcas que tornam…" | |
| 2.5.4 | Secção visível? | sim/não | Esconde secção + link "Parcerias" | Sim | |

> ⚠️ As cotas de patrocínio (Diamante/Ouro/Prata: títulos, subtítulos e benefícios) e o formulário de "Solicitar dossier" são **fixos no código**.

### 2.6 Secção `logistica` (Acesso & Localização — "06 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.6.1 | Título (selo "06 · …")? | texto | Etiqueta acima do H2 | "Localização & Acesso" | |
| 2.6.2 | Subtítulo (H2)? | texto | Cai para o título se vazio | "Tudo preparado para te acolher" | |
| 2.6.3 | Secção visível? | sim/não | Esconde coluna de informações + link "Acesso" | Sim | |

> ⚠️ A descrição desta secção **não é renderizada** no site (o parágrafo "Participação gratuita…" é fixo). As linhas Data/Horário/Local/Capacidade vêm das Definições (secção 1).

### 2.7 Secção `inscricao` (Formulário — "07 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.7.1 | Título (selo "07 · …")? | texto | Etiqueta acima do H3 do formulário | "Inscrição e Acesso" | |
| 2.7.2 | Subtítulo (H3)? | texto | "Garante a Tua Vaga" ↔ "Lista de Espera" | "Garante a Tua Vaga" | |
| 2.7.3 | Secção visível? | sim/não | Esconde o formulário + botão CTA do menu | Sim | |

> ⚠️ Todos os labels, placeholders e opções dos campos do formulário são **fixos no código** (Nome, Telefone/WhatsApp, E-mail, Igreja, Município, Faixa Etária, Como soubeste, Recomendação, Expectativa, Observações, termos).

### 2.8 Secção `materiais` (Materiais & Atalhos — "08 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.8.1 | Título (selo "08 · …")? | texto | Etiqueta acima do H2 | "Materiais & Atalhos" | |
| 2.8.2 | Subtítulo (H2)? | texto | "Tudo o que precisas num só lugar" | "Tudo o que precisas num só lugar" | |
| 2.8.3 | Descrição? | texto longo | Parágrafo de apoio | "Documentos oficiais para descarregar…" | |
| 2.8.4 | Secção visível? | sim/não | Esconde secção + link "Materiais" | Sim | |

### 2.9 Secção `galeria` (Acervo — "09 · …")

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.9.1 | Título (selo "09 · …")? | texto | Etiqueta acima do H2 | "Acervo & Memórias" | |
| 2.9.2 | Subtítulo (H2)? | texto | "A atmosfera que nos une" | "A atmosfera que nos une" | |
| 2.9.3 | Descrição? | texto longo | Parágrafo de apoio | "Momentos marcantes de adoração…" | |
| 2.9.4 | Secção visível? | sim/não | Esconde secção + link "Galeria" | Sim | |

### 2.10 Secção `footer` (Rodapé)

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 2.10.1 | Título do rodapé? | texto | Nome do evento no rodapé | "CONFERÊNCIA EXPLOSÃO PROFÉTICA MULHERES DE FOGO — 2ª EDIÇÃO" | |
| 2.10.2 | Subtítulo (slogan)? | texto | Frase de assinatura | "“Desperte a sua essência, viva o seu propósito.”" | |
| 2.10.3 | Descrição (localização)? | texto | Linha de morada no rodapé | "Via A1, Talatona, Luanda, Angola · Centro de Convenções Talatona" | |
| 2.10.4 | Secção visível? | sim/não | Esconde o rodapé completo | Sim | |

> ⚠️ Telefone (+244 932 583 167), e-mail (geral@womanexperience.ao) e links de Instagram/Facebook no rodapé são **fixos no código**.

---

## 3. Oradoras (`/admin` → Oradoras) — tabela `oradoras`

Cada oradora gera um cartão no roster e um retrato com nome, cargo e texto de foco.

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 3.1 | Nome completo? | texto | Roster + legenda da foto | — | |
| 3.2 | Cargo / função no evento? | texto | Roster + legenda da foto | — | |
| 3.3 | Subtítulo / ministério? | texto | Fallback do texto de foco | — | |
| 3.4 | Fotografia? | imagem | Retrato 3:4 + miniaturas | Upload (pasta `oradoras/`) ou URL | |
| 3.5 | Biografia resumida? | texto longo | Texto de foco (tem prioridade sobre o subtítulo) | — | |
| 3.6 | Marcar como "Mentora Principal"? | sim/não | ⚠️ Guardado na BD (`is_main`) mas **não altera a exibição pública** atual | Não | |
| 3.7 | Visível no site? | sim/não | Controla se aparece no site | Sim | |

> Repetir 3.1–3.7 para cada oradora (atualmente 3 oradoras seed).

---

## 4. Programação (`/admin` → Programação) — tabela `programacao`

Cada sessão gera uma linha no cronograma público. Nota: o site mostra **hora de início, período (Manhã/Tarde/Noite), título e descrição** — os campos "Preletora" e "Local" são guardados mas **não são renderizados** no site atual.

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 4.1 | Hora de início? | hora | Coluna de horas + chips de período | — | |
| 4.2 | Hora de fim? | hora | Usada para o intervalo do bloco (label "Manhã · 08h–12h") | — | |
| 4.3 | Período? | seleção (Manhã / Tarde / Noite) | Chips de filtro + etiqueta de cada sessão | — | |
| 4.4 | Título da sessão? | texto | Linha principal de cada sessão | — | |
| 4.5 | Descrição? | texto longo | Texto sob o título | — | |
| 4.6 | Preletora / facilitadora? | texto | ⚠️ Guardado na BD mas **não aparece no site** | — | |
| 4.7 | Local / sala? | texto | ⚠️ Guardado na BD mas **não aparece no site** | — | |
| 4.8 | Visível no site? | sim/não | Controla exibição | Sim | |

> Repetir 4.1–4.8 para cada sessão (atualmente 7 sessões seed).

---

## 5. Parceiros (`/admin` → Parceiros) — tabela `parceiros`

Do lado público, só entram no site os parceiros com **Estado = "Confirmado"** e **Visível = Sim**. O site usa apenas o **nome** (como texto) — mas apenas quando não existem logos em `logos_parceiros` (fallback do marquee).

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 5.1 | Nome da empresa / organização? | texto | Marquee de parceiros (fallback textual) | — | |
| 5.2 | Categoria? | seleção (Platina / Ouro / Prata / Bronze / Institucional) | Apenas uso interno no admin | — | |
| 5.3 | Estado? | seleção (Confirmado / Em análise / Pendente / Recusado) | Só "Confirmado" aparece no site | Confirmado | |
| 5.4 | Pessoa de contacto / responsável? | texto | ⚠️ Não aparece no site (interno) | — | |
| 5.5 | Telefone / WhatsApp? | texto | ⚠️ Não aparece no site | — | |
| 5.6 | E-mail? | texto | ⚠️ Não aparece no site | — | |
| 5.7 | Contribuição / apoio concedido? | texto longo | ⚠️ Não aparece no site | — | |
| 5.8 | Visível no site? | sim/não | Filtro de exibição pública | Sim | |

> Repetir 5.1–5.8 para cada parceiro (atualmente 3 seeds).

---

## 6. Logótipos de Parceiros (`/admin` → Logos Parceiros) — tabela `logos_parceiros`

É esta tabela que alimenta o **marquee de logos** no topo da secção de parcerias.

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 6.1 | Nome da marca / parceiro? | texto | Alt da imagem ou texto de fallback no marquee | — | |
| 6.2 | Logótipo? | imagem | Imagem no marquee (upload pasta `logos/` ou URL) | — | |
| 6.3 | Posicionamento? | seleção (Secção Parceiros / Hero / Rodapé) | ⚠️ Guardado na BD, mas o site atual mostra **todos** na mesma faixa — a posição ainda não é usada | "Secção Parceiros" | |
| 6.4 | Ordem? | número | Ordem no marquee (automática ao adicionar) | sequencial | |
| 6.5 | Visível no site? | sim/não | Controla exibição | Sim | |

> Repetir 6.1–6.5 para cada logo.

---

## 7. Galeria (`/admin` → Galeria) — tabela `galeria`

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 7.1 | Imagem? | imagem | Grid + lightbox (upload pasta `galeria/` ou URL) | — | |
| 7.2 | Categoria? | seleção (Mentoria / Comunidade / Bastidores / Edição 2025) | Filtro + etiqueta no hover/lightbox | — | |
| 7.3 | Legenda descritiva? | texto longo | Texto no hover e no lightbox | — | |
| 7.4 | Ordem? | número | Ordem no grid (automática) | sequencial | |
| 7.5 | Visível no site? | sim/não | Controla exibição | Sim | |

> Repetir 7.1–7.5 para cada foto. Nota: a "data" mostrada no lightbox é o ano de criação do registo.

---

## 8. Cartaz Oficial (`/admin` → Cartaz) — tabela `cartaz_oficial`

O cartaz aparece como cartão "Descarregar …" dentro de **Materiais & Atalhos**.

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 8.1 | Título do cartaz? | texto | Nome do cartão de download ("Descarregar {título}") | "Cartaz Oficial — Conferência Explosão Profética Mulheres de Fogo — 2ª Edição" | |
| 8.2 | Imagem do cartaz? | imagem | Arquivo descarregado (upload pasta `cartaz/` ou URL) | — | |
| 8.3 | Ativo no site? | sim/não | Sim = cartão visível; Não = rascunho interno | Ativo | |

> ⚠️ Os campos `descricao`, `resolucao` e `tamanho` existem na BD mas **não são editáveis na UI** nem mostrados no site (a descrição do cartão é fixa).

---

## 9. Materiais & Atalhos (`/admin` → Materiais e Atalhos) — tabela `materiais_atalhos`

Cada item vira um cartão clicável na grelha da secção "08 · Materiais & Atalhos".

| # | Pergunta | Tipo | Onde aparece | Valor atual | Resposta |
|---|----------|------|--------------|-------------|----------|
| 9.1 | Tipo? | seleção (Material / Atalho) | Material = botão "Descarregar"; Atalho = "Abrir ligação" | — | |
| 9.2 | Título? | texto | Título do cartão | — | |
| 9.3 | Descrição? | texto | Subtítulo do cartão (opcional) | — | |
| 9.4 | Ficheiro / URL? | ficheiro ou ligação | Destino do clique (materiais: PDF/Word/Excel/PPT/ZIP/TXT até 20 MB → Supabase Storage) | — | |
| 9.5 | Ordem? | número | Ordem na grelha (automática) | sequencial | |
| 9.6 | Visível no site? | sim/não | Controla exibição | Sim | |

> Repetir 9.1–9.6 para cada item. Atalhos já semeados: "Abrir no Mapa" e "Falar com Organização". O cartão "Entrar no Grupo de WhatsApp" vem das Definições (item 1.6), não desta tabela.

---

## 10. Campos FIXOS no código (não editáveis pelo admin)

Estes conteúdos aparecem no site público mas **só podem ser alterados por desenvolvedor**:

- Nome/wordmark do topo: "MULHERES DE FOGO"
- Rótulos do menu de navegação (Propósito, Programação, Oradoras, Parcerias, Acesso, Galeria, Materiais)
- Slogan fixo "Desperte a sua essência, viva o seu propósito." (hero e secção visão)
- Blocos "3 componentes" e 4 eixos temáticos da secção Propósito
- Cotas de patrocínio (Diamante/Ouro/Prata) e formulário de dossier
- Todos os campos e opções do formulário de inscrição
- Contactos do rodapé (telefone, e-mail, Instagram, Facebook)
- Página `/termos` (termos e privacidade) — 100% estática
- Página `/convite` — mostra apenas o nome de quem convidou (vem da BD, não editável)
- Design system: cores, tipografia, tema claro/escuro

---

## Resumo — origem de cada campo

| Módulo admin | Tabela(s) | Secção do site |
|---|---|---|
| Definições | `app_settings`, `eventos` | Hero, Logística, Materiais (grupo WA), Formulário |
| Ingressos e Vagas | `app_settings` (`vagas_totais`), `lotes_ingressos` | Contadores de vagas, "Lote atual", preço |
| Conteúdo do Site | `secoes_conteudo` | Todos os títulos/subtítulos/descrições + visibilidade |
| Oradoras | `oradoras` | Secção Oradoras |
| Programação | `programacao` | Secção Programação |
| Parceiros | `parceiros` | Marquee (fallback de nomes) |
| Logos Parceiros | `logos_parceiros` | Marquee de logos |
| Galeria | `galeria` | Secção Galeria |
| Cartaz | `cartaz_oficial` | Cartão de download em Materiais |
| Materiais e Atalhos | `materiais_atalhos` | Grelha de cartões em Materiais |
