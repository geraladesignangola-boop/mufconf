import React, { useRef, useState } from 'react'
import { motion } from 'motion/react'
import {
  Download,
  FileText,
  Loader2,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Ticket,
} from 'lucide-react'
import {
  fetchPublicBilhete,
  fetchPublicEventConfig,
  PublicEventConfig,
  submitPublicRelato,
} from '../../services/publicDataService'
import { BilhetePublico, RelatoTipo } from '../../types/database'
import Bilhete from '../Bilhete'
import { exportarBilhete } from '../../lib/exportBilhete'

const inputClass =
  'w-full bg-[#141413] border border-[#F7F7F5]/14 focus:border-[#B95E26] text-[#F7F7F5] px-4 py-3 text-sm focus:outline-none transition-colors duration-150 placeholder-[#6B6B66]';

/**
 * Pesquisa pública de bilhete.
 *
 * Protecção de dados pessoais: são necessários DOIS factores — o termo de
 * pesquisa (nome, e-mail ou código) E o telefone registado na inscrição.
 * Sem ambos não se devolve nada, e a mensagem de erro é a mesma quando não
 * existe inscrição e quando o telefone não confere (não se revela, assim,
 * a existência de inscrições de terceiros).
 */
export default function ModernaApoioParticipante() {
  const [termo, setTermo] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [pesquisando, setPesquisando] = useState(false);
  const [resultado, setResultado] = useState<BilhetePublico | null>(null);
  const [exportando, setExportando] = useState<'pdf' | 'png' | null>(null);
  const [config, setConfig] = useState<PublicEventConfig | null>(null);
  const [relatoTipo, setRelatoTipo] = useState<RelatoTipo>('problema');
  const [relatoNome, setRelatoNome] = useState('');
  const [relatoContacto, setRelatoContacto] = useState('');
  const [relatoMensagem, setRelatoMensagem] = useState('');
  const [relatoErro, setRelatoErro] = useState('');
  const [relatoEnviado, setRelatoEnviado] = useState(false);
  const [aEnviarRelato, setAEnviarRelato] = useState(false);
  const bilheteRef = useRef<HTMLDivElement>(null);

  const carregarConfig = async () => {
    if (config) return config;
    try {
      const dados = await fetchPublicEventConfig();
      setConfig(dados);
      return dados;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setAviso('');
    setResultado(null);

    const termoLimpo = termo.trim();
    const telefoneLimpo = telefone.trim();

    if (termoLimpo.length < 3) {
      setErro('Indica pelo menos 3 caracteres: nome, e-mail ou código de inscrição.');
      return;
    }
    if (telefoneLimpo.replace(/\D/g, '').length < 9) {
      setErro('Indica o telefone registado na inscrição.');
      return;
    }

    setPesquisando(true);
    try {
      await carregarConfig();
      const dados = await fetchPublicBilhete(termoLimpo, telefoneLimpo);
      if (!dados) {
        // Mensagem única: não revela se a inscrição existe ou se o telefone está errado.
        setAviso(
          'Não encontrámos nenhuma inscrição com estes dados. Confirma o nome, o e-mail ou o código e o telefone registado.'
        );
        return;
      }
      setResultado(dados);
    } catch (err) {
      setErro((err as Error).message || 'Não foi possível pesquisar agora. Tenta novamente.');
    } finally {
      setPesquisando(false);
    }
  };

  const ficheiroBilhete = () =>
    `bilhete-${resultado?.codigo || resultado?.referral_code || 'inscricao'}`;

  const handleExportar = async (formato: 'pdf' | 'png') => {
    if (!bilheteRef.current || exportando) return;
    setExportando(formato);
    try {
      await exportarBilhete(bilheteRef.current, formato, ficheiroBilhete());
    } catch {
      setErro('Não foi possível exportar o bilhete. Tenta novamente.');
    } finally {
      setExportando(null);
    }
  };

  const novaPesquisa = () => {
    setResultado(null);
    setTermo('');
    setTelefone('');
    setErro('');
    setAviso('');
  };

  const handleEnviarRelato = async (e: React.FormEvent) => {
    e.preventDefault();
    setRelatoErro('');
    setRelatoEnviado(false);

    const nomeLimpo = relatoNome.trim();
    const mensagemLimpa = relatoMensagem.trim();
    if (nomeLimpo.length < 2) {
      setRelatoErro('Indica o teu nome para podermos acompanhar o relato.');
      return;
    }
    if (mensagemLimpa.length < 5 || mensagemLimpa.length > 2000) {
      setRelatoErro('Escreve uma mensagem entre 5 e 2000 caracteres.');
      return;
    }

    setAEnviarRelato(true);
    try {
      const resultado = await submitPublicRelato({
        tipo: relatoTipo,
        nome: nomeLimpo,
        contacto: relatoContacto.trim(),
        mensagem: mensagemLimpa,
      });
      if (!resultado.success) {
        setRelatoErro(resultado.error || 'Não foi possível enviar o relato. Tenta novamente.');
        return;
      }

      setRelatoNome('');
      setRelatoContacto('');
      setRelatoMensagem('');
      setRelatoEnviado(true);
    } catch {
      setRelatoErro('Não foi possível enviar o relato. Tenta novamente.');
    } finally {
      setAEnviarRelato(false);
    }
  };

  return (
    <section id="apoio-participante" className="bg-[var(--wex-dark-block)] text-[var(--wex-on-dark)] scroll-mt-20">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
            Apoio à participante
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl font-bold text-[#F7F7F5]">
            Bilhete e ajuda
          </h2>
          <p className="mt-3 mb-8 max-w-2xl text-sm text-[#A2A09A] leading-relaxed">
            Recupera o teu bilhete ou envia uma mensagem à equipa organizadora, mesmo que não tenhas conseguido concluir a inscrição.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <Ticket className="w-5 h-5 text-[#B95E26]" />
                <div>
                  <h3 className="text-xl font-bold font-[family-name:var(--font-moderna-display)] text-[#F7F7F5]">
                    Encontrar o meu bilhete
                  </h3>
                  <p className="text-xs text-[#A2A09A] mt-1">Recupera o bilhete para apresentar no credenciamento.</p>
                </div>
              </div>

        {!resultado && (
          <form onSubmit={handleSubmit} className="border border-[#F7F7F5]/10 bg-[#111110] p-5 sm:p-7 space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="pesq-termo"
                className="flex items-baseline justify-between text-xs font-semibold text-[#E5E3DD]"
              >
                <span>
                  Nome, e-mail ou código <span className="text-[#B95E26]">*</span>
                </span>
                <span className="font-[family-name:var(--font-caverna-mono)] text-[10px] text-[#8D8B84]">
                  como na inscrição
                </span>
              </label>
              <input
                id="pesq-termo"
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Ex.: Maria Silva, maria@email.com ou MUF-0001"
                autoComplete="off"
                className={inputClass}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="pesq-telefone"
                className="flex items-baseline justify-between text-xs font-semibold text-[#E5E3DD]"
              >
                <span>
                  Telefone registado <span className="text-[#B95E26]">*</span>
                </span>
                <span className="font-[family-name:var(--font-caverna-mono)] text-[10px] text-[#8D8B84]">
                  confirmação
                </span>
              </label>
              <input
                id="pesq-telefone"
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex.: 923 000 000"
                autoComplete="tel"
                className={inputClass}
              />
            </div>

            <div className="flex items-start gap-2.5 text-[11px] text-[#8D8B84] leading-relaxed border-t border-[#F7F7F5]/10 pt-4">
              <ShieldCheck className="w-4 h-4 text-[#B95E26] flex-shrink-0 mt-0.5" />
              <span>
                Para proteger os dados pessoais, são necessários os dois campos: o telefone tem de
                coincidir com o registado na inscrição. Nunca mostramos inscrições de outras pessoas.
              </span>
            </div>

            {(erro || aviso) && (
              <p
                className={`text-xs px-3.5 py-2.5 border ${
                  erro
                    ? 'text-[#F7F7F5] bg-[#141413] border-[#B95E26]'
                    : 'text-[#A2A09A] bg-[#141413] border-[#F7F7F5]/20'
                }`}
              >
                {erro || aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={pesquisando}
              aria-busy={pesquisando}
              className="w-full py-4 bg-[#F7F7F5] hover:bg-[#B95E26] text-[#0B0B0A] hover:text-[#F7F7F5] font-bold uppercase tracking-[0.14em] text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {pesquisando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>A pesquisar…</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Pesquisar bilhete</span>
                </>
              )}
            </button>
          </form>
        )}

        {resultado && (
          <div className="border border-[#B95E26]/60 bg-[#111110] p-6 sm:p-8">
            <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-widest">
              Bilhete encontrado
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-2xl font-bold text-[#F7F7F5]">
              {resultado.nome}
            </h2>
            <p className="mt-2 text-sm text-[#A2A09A]">
              Nº de inscrição: <span className="text-[#F7F7F5]">{resultado.codigo || '—'}</span>
              {' · '}
              Estado: <span className="text-[#F7F7F5]">{resultado.estado}</span>
            </p>

            <div ref={bilheteRef} className="mt-6 max-w-[760px] mx-auto">
              <Bilhete
                nome={resultado.nome}
                telefone={resultado.telefone}
                email={resultado.email}
                igreja={resultado.igreja}
                municipio={resultado.municipio}
                faixaEtaria={resultado.faixa_etaria}
                numeroInscricao={resultado.codigo}
                qrValue={`MDF2026|${resultado.referral_code || resultado.codigo || ''}|${resultado.nome}`}
                evento={{
                  data: config?.eventoData || undefined,
                  horario: config?.eventoHorario || undefined,
                  local: config?.eventoLocal || undefined,
                }}
              />
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => handleExportar('pdf')}
                disabled={exportando !== null}
                className="px-5 py-3 bg-[#F7F7F5] hover:bg-[#B95E26] text-[#0B0B0A] hover:text-[#F7F7F5] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
              >
                {exportando === 'pdf' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                Baixar PDF
              </button>
              <button
                type="button"
                onClick={() => handleExportar('png')}
                disabled={exportando !== null}
                className="px-5 py-3 border border-[#F7F7F5]/25 text-[#F7F7F5] hover:border-[#B95E26] hover:text-[#B95E26] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
              >
                {exportando === 'png' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Baixar PNG
              </button>
              <button
                type="button"
                onClick={novaPesquisa}
                className="px-5 py-3 border border-[#F7F7F5]/25 text-[#F7F7F5] hover:border-[#B95E26] hover:text-[#B95E26] font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                Nova pesquisa
              </button>
            </div>

            <p className="mt-5 text-[11px] text-[#8D8B84] text-center leading-relaxed">
              Apresenta o QR Code no credenciamento do dia do evento.
            </p>
          </div>
        )}
            </div>

            <div className="border border-[#F7F7F5]/10 bg-[#111110] p-5 sm:p-7">
              <div className="flex items-center gap-3 mb-5">
                <MessageSquareWarning className="w-5 h-5 text-[#B95E26]" />
                <div>
                  <h3 className="text-xl font-bold font-[family-name:var(--font-moderna-display)] text-[#F7F7F5]">
                    Relatar um problema ou comentário
                  </h3>
                  <p className="text-xs text-[#A2A09A] mt-1">A equipa pode ajudar mesmo sem uma inscrição concluída.</p>
                </div>
              </div>

              <form onSubmit={handleEnviarRelato} className="space-y-4">
                <div className="flex gap-2" role="group" aria-label="Tipo de mensagem">
                  {(['problema', 'comentario'] as const).map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      aria-pressed={relatoTipo === tipo}
                      onClick={() => setRelatoTipo(tipo)}
                      className={`flex-1 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] border transition-colors ${
                        relatoTipo === tipo
                          ? 'bg-[#B95E26] border-[#B95E26] text-[#F7F7F5]'
                          : 'bg-[#141413] border-[#F7F7F5]/14 text-[#A2A09A] hover:border-[#F7F7F5]/30'
                      }`}
                    >
                      {tipo === 'problema' ? 'Problema' : 'Comentário'}
                    </button>
                  ))}
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="relato-nome" className="text-xs font-semibold text-[#E5E3DD]">Nome *</label>
                  <input
                    id="relato-nome"
                    type="text"
                    required
                    minLength={2}
                    maxLength={120}
                    value={relatoNome}
                    onChange={(e) => setRelatoNome(e.target.value)}
                    autoComplete="name"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="relato-contacto" className="text-xs font-semibold text-[#E5E3DD]">Telefone ou e-mail <span className="text-[#8D8B84]">(opcional)</span></label>
                  <input
                    id="relato-contacto"
                    type="text"
                    maxLength={120}
                    value={relatoContacto}
                    onChange={(e) => setRelatoContacto(e.target.value)}
                    autoComplete="email"
                    placeholder="Para podermos responder"
                    className={inputClass}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="relato-mensagem" className="text-xs font-semibold text-[#E5E3DD]">Mensagem *</label>
                  <textarea
                    id="relato-mensagem"
                    required
                    minLength={5}
                    maxLength={2000}
                    rows={4}
                    value={relatoMensagem}
                    onChange={(e) => setRelatoMensagem(e.target.value)}
                    placeholder={relatoTipo === 'problema' ? 'Conta-nos o que aconteceu durante a inscrição…' : 'Escreve a tua mensagem para a equipa…'}
                    className={`${inputClass} resize-y`}
                  />
                  <p className="text-right text-[10px] text-[#8D8B84] tabular-nums">{relatoMensagem.length}/2000</p>
                </div>

                {(relatoErro || relatoEnviado) && (
                  <p className={`text-xs px-3.5 py-2.5 border ${relatoErro ? 'text-[#F7F7F5] border-[#B95E26] bg-[#141413]' : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10'}`}>
                    {relatoErro || 'Mensagem enviada à equipa organizadora.'}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={aEnviarRelato}
                  aria-busy={aEnviarRelato}
                  className="w-full py-3.5 bg-[#F7F7F5] hover:bg-[#B95E26] text-[#0B0B0A] hover:text-[#F7F7F5] font-bold uppercase tracking-[0.14em] text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {aEnviarRelato ? <><Loader2 className="w-4 h-4 animate-spin" />A enviar…</> : 'Enviar mensagem'}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
