import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  ChevronDown,
  Download,
  FileText,
  Image as ImageIcon,
  Loader2,
  MessageCircle,
  Share2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Bilhete from '../Bilhete';
import { exportarBilhete as exportarBilheteImg } from '../../lib/exportBilhete';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useReferral } from '../../hooks/useReferral';
import {
  fetchPublicEventConfig,
  fetchPublicLotes,
  PublicEventConfig,
} from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { useToast } from '../ui/Toast';
import { Reveal } from '../ui/Reveal';

interface ModernaLogisticaInscricaoProps {
  referredByCode?: string;
  /** Controla a coluna esquerda (Localização e contactos) */
  mostrarLogistica?: boolean;
  /** Controla a coluna direita (formulário de inscrição) */
  mostrarInscricao?: boolean;
}

const baseInputClass =
  'w-full bg-[#141413] border border-[#F7F7F5]/14 focus:border-[#B95E26] text-[#F7F7F5] px-4 py-3 text-sm focus:outline-none transition-colors duration-150 placeholder-[#6B6B66]';

function inputClass(error?: string) {
  return `${baseInputClass} ${error ? 'border-[#B95E26]' : ''}`;
}

export default function ModernaLogisticaInscricao({
  referredByCode,
  mostrarLogistica = true,
  mostrarInscricao = true,
}: ModernaLogisticaInscricaoProps = {}) {
  const { generateReferralCode } = useReferral();
  const { toast } = useToast();
  const textoSecao = useSecaoTexto('logistica');
  const textoInscricao = useSecaoTexto('inscricao');

  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [igreja, setIgreja] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [faixaEtaria, setFaixaEtaria] = useState('');
  const [comoSoube, setComoSoube] = useState('');
  const [recomendacao, setRecomendacao] = useState('');
  const [expectativa, setExpectativa] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [lastSubmitTime, setLastSubmitTime] = useState(0);
  const [accessCode, setAccessCode] = useState('');
  const [inscricaoCodigo, setInscricaoCodigo] = useState('');
  const [exportando, setExportando] = useState<'pdf' | 'png' | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [partilhado, setPartilhado] = useState(false);
  const bilheteRef = useRef<HTMLDivElement>(null);
  const [inscricoesAbertas, setInscricoesAbertas] = useState<boolean>(true);
  const [eventConfig, setEventConfig] = useState<PublicEventConfig | null>(null);
  const [lotes, setLotes] = useState<{ id: string; nome: string; preco: number; capacidade: number }[]>([]);

  useEffect(() => {
    let ativo = true;
    async function loadPublicData() {
      try {
        const [resConfig, resLotes] = await Promise.allSettled([
          fetchPublicEventConfig(),
          fetchPublicLotes(),
        ]);
        if (!ativo) return;
        if (resConfig.status === 'fulfilled') {
          setEventConfig(resConfig.value);
          setInscricoesAbertas(resConfig.value.inscricoesAbertas);
        }
        if (resLotes.status === 'fulfilled') {
          setLotes(resLotes.value);
        }
      } catch {
        // fallback limpo: os defaults do estado mantêm-se
      }
    }
    loadPublicData();
    return () => {
      ativo = false;
    };
  }, []);

  const vagasTotais = eventConfig?.vagasTotais ?? 0;
  const dataEvento = eventConfig?.eventoData ?? '';
  const horarioEvento = eventConfig?.eventoHorario ?? '';
  const localEvento = eventConfig?.eventoLocal ?? '';

  const precoLabel = useMemo(() => {
    if (lotes.length === 0) return 'Gratuita';
    const minimo = Math.min(...lotes.map((l) => l.preco));
    return minimo === 0 ? 'Gratuita' : `${minimo.toLocaleString('pt-PT')} Kz`;
  }, [lotes]);

  const qrPayload = useMemo(
    () =>
      accessCode
        ? `MDF2026|${accessCode}|${nome.trim()}`
        : 'MDF2026',
    [accessCode, nome]
  );

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!nome.trim()) nextErrors.nome = 'O nome completo é obrigatório';
    if (!whatsapp.trim()) nextErrors.whatsapp = 'O número de telefone / WhatsApp é obrigatório';
    if (email.trim() && (!/\S+@\S+\.\S+/.test(email) || email.includes('..'))) {
      nextErrors.email = 'Formato de e-mail inválido';
    }
    if (!aceitouTermos) nextErrors.aceitouTermos = 'Confirma a tua intenção de participar';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  // Validação em tempo real: assim que a utilizadora corrige um campo com erro,
  // a mensagem desaparece sem esperar pelo próximo submit.
  const limparErroCampo = (campo: string) => {
    if (!errors[campo]) return;
    setErrors((prev) => {
      const prox = { ...prev };
      delete prox[campo];
      return prox;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = Date.now();
    if (now - lastSubmitTime < 10000) {
      setErrors({ submit: 'Aguarda 10 segundos antes de tentar novamente.' });
      return;
    }

    setLastSubmitTime(now);
    setIsSubmitting(true);

    if (!navigator.onLine) {
      setErrors({ submit: 'Sem ligação à internet. Verifica a tua rede e tenta novamente.' });
      toast('error', 'Sem ligação à internet. Verifica a tua rede e tenta novamente.');
      setIsSubmitting(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setErrors({ submit: 'Serviço de inscrição indisponível. Tenta novamente mais tarde.' });
      toast('error', 'Serviço de inscrição indisponível. Tenta novamente mais tarde.');
      setIsSubmitting(false);
      return;
    }

    try {
      const generatedCode = generateReferralCode(nome);
      const effectiveEmail =
        email.trim() || `${whatsapp.replace(/\D/g, '') || Date.now()}@participante.local`;

      const { data, error } = await supabase.rpc('create_public_inscricao', {
        p_nome: nome.trim(),
        p_email: effectiveEmail,
        p_telefone: whatsapp.trim(),
        p_whatsapp: whatsapp.trim(),
        p_morada: municipio.trim() || null,
        p_igreja: igreja.trim() || null,
        p_localizacao: municipio.trim() || null,
        p_recomendacao: recomendacao.trim() || null,
        p_observacoes: observacoes.trim() || null,
        p_faixa_etaria: faixaEtaria || null,
        p_como_soube: comoSoube || null,
        p_expectativa: expectativa.trim() || null,
        p_referral_code: generatedCode,
        p_meta_convidadas: null,
        p_referred_by_code: referredByCode || null,
      });

      if (error) {
        if (error.message.includes('duplicate_registration')) {
          const codigoExistente = error.message.split(':')[1]?.trim();
          setErrors({
            whatsapp: codigoExistente
              ? `Este número já está registado (código ${codigoExistente}). Se a inscrição foi cancelada, tenta novamente.`
              : 'Este número de telefone já está registado. Se a inscrição foi cancelada, tenta novamente.',
          });
          setIsSubmitting(false);
          return;
        }
        if (error.message.includes('inscricoes_fechadas')) {
          setInscricoesAbertas(false);
          setIsSubmitting(false);
          return;
        }
        throw error;
      }

      const createdRow = Array.isArray(data) ? data[0] : data;
      setAccessCode(createdRow?.referral_code || generatedCode);
      setInscricaoCodigo(createdRow?.codigo || '');
      setIsSubmitting(false);
      setIsSuccess(true);
      toast('success', 'Inscrição confirmada! O teu bilhete está disponível abaixo.');

      const el = document.getElementById('moderna-inscricao');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      const msg = 'Erro ao processar inscrição. Verifica a tua ligação e tenta novamente.';
      setErrors({ submit: msg });
      toast('error', msg);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setNome('');
    setWhatsapp('');
    setEmail('');
    setIgreja('');
    setMunicipio('');
    setFaixaEtaria('');
    setComoSoube('');
    setRecomendacao('');
    setExpectativa('');
    setObservacoes('');
    setAceitouTermos(false);
    setIsSuccess(false);
    setAccessCode('');
    setInscricaoCodigo('');
    setErrors({});
  };

  const ficheiroBilhete = () => `bilhete-${inscricaoCodigo || accessCode || 'inscricao'}`;

  const exportarBilhete = async (formato: 'pdf' | 'png') => {
    if (!bilheteRef.current || exportando) return;
    setExportMenuOpen(false);
    setExportando(formato);
    try {
      await exportarBilheteImg(bilheteRef.current, formato, ficheiroBilhete());
    } catch (err) {
      console.error('Erro ao exportar bilhete:', err);
      const msg = 'Não foi possível exportar o bilhete. Tenta novamente.';
      setErrors({ submit: msg });
      toast('error', msg);
    } finally {
      setExportando(null);
    }
  };

  const partilharBilhete = async () => {
    const texto = `O meu bilhete para a conferência! ${window.location.origin}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Bilhete de Inscrição', text: texto, url: window.location.origin });
      } else {
        await navigator.clipboard.writeText(`${texto} ${window.location.origin}`);
        setPartilhado(true);
        setTimeout(() => setPartilhado(false), 2500);
      }
    } catch {
      // partilha cancelada — ignorar
    }
  };

  return (
    <section id="moderna-logistica" className="bg-[var(--wex-dark-block)] text-[var(--wex-on-dark)]">
      <div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Informações Principais e Contactos (5 cols) */}
          {mostrarLogistica && (
          <Reveal className={`${mostrarInscricao ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-10`}>
            <div>
              <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                {textoSecao?.titulo ? `07 · ${textoSecao.titulo}` : '07 · Acesso & Localização'}
              </p>
              <h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[#F7F7F5] leading-[1.06] text-balance">
                {textoSecao?.subtitulo || textoSecao?.titulo || 'Informações Principais'}
              </h2>
              <p className="mt-4 text-sm sm:text-[15px] text-[#A2A09A] leading-relaxed">
                Participação gratuita com confirmação imediata{vagasTotais > 0 ? ` até o limite de ${vagasTotais} vagas` : ''}. Após atingir a capacidade, fica ativa a lista de espera.
              </p>
            </div>

            <div className="divide-y divide-[#F7F7F5]/12 border-y border-[#F7F7F5]/12 text-sm">
              {dataEvento && (
              <div className="py-3.5 flex justify-between gap-4">
                <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#8D8B84]">Data</span>
                <span className="font-semibold text-[#F7F7F5] text-right">{dataEvento}</span>
              </div>
              )}
              {horarioEvento && (
              <div className="py-3.5 flex justify-between gap-4">
                <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#8D8B84]">Horário</span>
                <span className="font-semibold text-[#F7F7F5] tabular-nums text-right">{horarioEvento}</span>
              </div>
              )}
              {localEvento && (
              <div className="py-3.5 flex justify-between gap-4">
                <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#8D8B84]">Local</span>
                <span className="font-semibold text-[#F7F7F5] text-right">{localEvento}</span>
              </div>
              )}
              <div className="py-3.5 flex justify-between gap-4">
                <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#8D8B84]">Capacidade</span>
                <span className="font-semibold text-[#F7F7F5] tabular-nums text-right">
                  Presencial{vagasTotais > 0 ? ` · ${vagasTotais} vagas` : ''} · {precoLabel}
                </span>
              </div>
              {lotes.length > 0 && (
                <div className="py-3.5 flex justify-between gap-4">
                  <span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#8D8B84]">Lote atual</span>
                  <span className="font-semibold text-[#F7F7F5] text-right">{lotes[0].nome}</span>
                </div>
              )}
            </div>
          </Reveal>
          )}

          {/* Right Column: Registration Form (7 cols) */}
          {mostrarInscricao && (
          <Reveal id="moderna-inscricao" delay={120} className={`${mostrarLogistica ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
            <AnimatePresence mode="wait">
              {!isSuccess ? (
                <motion.div
                  key="moderna-form"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="border border-[#F7F7F5]/14 bg-[#111110] p-6 sm:p-10"
                >
                  <div className="pb-6 mb-6 border-b border-[#F7F7F5]/12 flex items-baseline justify-between gap-4">
                    <div>
                      <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
                        {textoInscricao?.titulo ? `08 · ${textoInscricao.titulo}` : '08 · Inscrição e Acesso'}
                      </p>
                      <h3 className="mt-2 font-[family-name:var(--font-moderna-display)] text-2xl sm:text-3xl font-bold text-[#F7F7F5]">
                        {inscricoesAbertas
                          ? textoInscricao?.subtitulo || 'Garante a Tua Vaga'
                          : 'Lista de Espera'}
                      </h3>
                    </div>
                  </div>

                  {referredByCode && (
                    <div className="mb-6 p-3.5 border border-[#B95E26]/40 bg-[#141413] text-xs text-[#F7F7F5] flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#B95E26] shrink-0" />
                      <span>Foste convidada através de um link de partilha oficial.</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <ModernaField label="Nome Completo" required htmlFor="mod-nome" error={errors.nome}>
                      <input
                        id="mod-nome"
                        type="text"
                        value={nome}
                        onChange={(e) => {
                          setNome(e.target.value);
                          limparErroCampo('nome');
                        }}
                        placeholder="Escreve o teu nome completo"
                        aria-invalid={Boolean(errors.nome)}
                        className={inputClass(errors.nome)}
                      />
                    </ModernaField>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ModernaField label="Telefone / WhatsApp" required htmlFor="mod-whatsapp" error={errors.whatsapp}>
                        <input
                          id="mod-whatsapp"
                          type="tel"
                          value={whatsapp}
                          onChange={(e) => {
                            setWhatsapp(e.target.value);
                            limparErroCampo('whatsapp');
                          }}
                          placeholder="Ex: 923 000 000"
                          aria-invalid={Boolean(errors.whatsapp)}
                          className={inputClass(errors.whatsapp)}
                        />
                      </ModernaField>

                      <ModernaField label="E-mail" htmlFor="mod-email" help="Opcional" error={errors.email}>
                        <input
                          id="mod-email"
                          type="email"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            limparErroCampo('email');
                          }}
                          placeholder="teu@email.com"
                          aria-invalid={Boolean(errors.email)}
                          className={inputClass(errors.email)}
                        />
                      </ModernaField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ModernaField label="Igreja / Comunidade" htmlFor="mod-igreja" help="Opcional">
                        <input
                          id="mod-igreja"
                          type="text"
                          value={igreja}
                          onChange={(e) => setIgreja(e.target.value)}
                          placeholder="Nome da igreja ou comunidade"
                          className={baseInputClass}
                        />
                      </ModernaField>

                      <ModernaField label="Município / Bairro" htmlFor="mod-municipio" help="Opcional">
                        <input
                          id="mod-municipio"
                          type="text"
                          value={municipio}
                          onChange={(e) => setMunicipio(e.target.value)}
                          placeholder="Ex: Talatona, Maianga, Kilamba..."
                          className={baseInputClass}
                        />
                      </ModernaField>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ModernaField label="Faixa Etária" htmlFor="mod-faixa" help="Opcional">
                        <select
                          id="mod-faixa"
                          value={faixaEtaria}
                          onChange={(e) => setFaixaEtaria(e.target.value)}
                          className={baseInputClass}
                        >
                          <option value="">Seleciona…</option>
                          <option value="18-25">18–25 anos</option>
                          <option value="26-35">26–35 anos</option>
                          <option value="36-45">36–45 anos</option>
                          <option value="46+">46+ anos</option>
                        </select>
                      </ModernaField>

                      <ModernaField label="Como soubeste do evento?" htmlFor="mod-como-soube" help="Opcional">
                        <select
                          id="mod-como-soube"
                          value={comoSoube}
                          onChange={(e) => setComoSoube(e.target.value)}
                          className={baseInputClass}
                        >
                          <option value="">Seleciona…</option>
                          <option value="Instagram">Instagram</option>
                          <option value="Facebook">Facebook</option>
                          <option value="Indicação de amiga">Indicação de amiga</option>
                          <option value="Igreja">Igreja</option>
                          <option value="Outro">Outro</option>
                        </select>
                      </ModernaField>
                    </div>

                    <ModernaField label="Recomendação / Como nos conheceste" htmlFor="mod-recomendacao" help="Opcional">
                      <input
                        id="mod-recomendacao"
                        type="text"
                        value={recomendacao}
                        onChange={(e) => setRecomendacao(e.target.value)}
                        placeholder="Ex: amiga Maria, pastor da igreja, flyer no centro comercial..."
                        className={baseInputClass}
                      />
                    </ModernaField>

                    <ModernaField label="O que esperas desta conferência?" htmlFor="mod-expectativa" help="Opcional">
                      <textarea
                        id="mod-expectativa"
                        rows={3}
                        value={expectativa}
                        onChange={(e) => setExpectativa(e.target.value)}
                        placeholder="Escreve o que esperas ganhar com esta experiência..."
                        className={`${baseInputClass} resize-none`}
                      />
                    </ModernaField>

                    <ModernaField label="Observações" htmlFor="mod-observacoes" help="Opcional">
                      <textarea
                        id="mod-observacoes"
                        rows={2}
                        value={observacoes}
                        onChange={(e) => setObservacoes(e.target.value)}
                        placeholder="Acessibilidade, necessidades especiais ou qualquer informação extra..."
                        className={`${baseInputClass} resize-none`}
                      />
                    </ModernaField>

                    <div className="pt-2 space-y-1.5">
                      <label htmlFor="mod-termos" className="flex items-start gap-3 cursor-pointer select-none">
                        <input
                          id="mod-termos"
                          type="checkbox"
                          checked={aceitouTermos}
                          onChange={(e) => {
                            setAceitouTermos(e.target.checked);
                            limparErroCampo('aceitouTermos');
                          }}
                          className="sr-only"
                        />
                        <div
                          className={`mt-0.5 w-5 h-5 border flex items-center justify-center shrink-0 transition-colors ${
                            errors.aceitouTermos
                              ? 'border-[#B95E26]'
                              : aceitouTermos
                              ? 'border-[#B95E26] bg-[#B95E26]'
                              : 'border-[#F7F7F5]/20 bg-[#141413]'
                          }`}
                        >
                          {aceitouTermos && <Check className="w-3.5 h-3.5 text-[#0B0B0A] stroke-[3]" />}
                        </div>
                        <span className="text-xs text-[#A2A09A] leading-snug">
                          Confirmo a minha intenção de comparecer no local do evento e autorizo o contacto da comissão organizadora para envio do código de acesso.
                        </span>
                      </label>
                      {errors.aceitouTermos && (
                        <p className="text-xs text-[#B95E26]">{errors.aceitouTermos}</p>
                      )}
                    </div>

                    {errors.submit && (
                      <p className="text-xs text-[#F7F7F5] bg-[#141413] border border-[#B95E26] px-3.5 py-2.5">
                        {errors.submit}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      aria-busy={isSubmitting}
                      className="w-full py-4 bg-[#F7F7F5] hover:bg-[#B95E26] text-[#0B0B0A] hover:text-[#F7F7F5] font-bold uppercase tracking-[0.14em] text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>A Emitir Código de Acesso...</span>
                        </>
                      ) : (
                        <span>{inscricoesAbertas ? 'Confirmar Inscrição Gratuita' : 'Entrar na Lista de Espera'}</span>
                      )}
                    </button>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-[family-name:var(--font-caverna-mono)] text-[#8D8B84] pt-2 border-t border-[#F7F7F5]/10">
                      <span className="inline-flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-[#B95E26]" />
                        Confirmação imediata com código de acesso
                      </span>
                      <span>Registo presencial sujeito a vagas</span>
                    </div>
                  </form>
                </motion.div>
              ) : (
                <motion.div
                  key="moderna-success"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  className="border border-[#B95E26]/60 bg-[#111110] p-7 sm:p-10 text-center"
                >
                  <p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-widest">
                    Confirmação Imediata
                  </p>
                  <h3 className="mt-3 font-[family-name:var(--font-moderna-display)] text-2xl sm:text-3xl font-bold text-[#F7F7F5]">
                    Aqui está o teu bilhete.
                  </h3>
                  <p className="mt-3 text-sm text-[#A2A09A] max-w-md mx-auto leading-relaxed">
                    Apresenta o QR Code no credenciamento{dataEvento ? ` do dia ${dataEvento}` : ''}{localEvento ? ` em ${localEvento}` : ''}.
                  </p>

                  <div ref={bilheteRef} className="mt-7 max-w-[760px] mx-auto">
                    <Bilhete
                      nome={nome}
                      telefone={whatsapp}
                      email={email}
                      igreja={igreja}
                      municipio={municipio}
                      faixaEtaria={faixaEtaria}
                      numeroInscricao={inscricaoCodigo || accessCode}
                      qrValue={qrPayload}
                      evento={{
                        data: dataEvento || undefined,
                        horario: horarioEvento || undefined,
                        local: localEvento || undefined,
                      }}
                    />
                  </div>

                  <div className="mt-7 flex flex-wrap justify-center gap-3">
                    {/* Exportar: dropdown PDF / PNG */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setExportMenuOpen((v) => !v)}
                        disabled={exportando !== null}
                        className="px-5 py-3 bg-[#F7F7F5] hover:bg-[#B95E26] text-[#0B0B0A] hover:text-[#F7F7F5] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-70"
                      >
                        {exportando ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span>{exportando ? 'A exportar…' : 'Exportar'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${exportMenuOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {exportMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.15 }}
                            className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-20 w-40 bg-[#141413] border border-[#F7F7F5]/16 shadow-xl overflow-hidden"
                          >
                            <button
                              type="button"
                              onClick={() => exportarBilhete('pdf')}
                              className="w-full px-4 py-3 text-left text-xs font-semibold text-[#F7F7F5] hover:bg-[#B95E26]/15 flex items-center gap-2.5 transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4 text-[#B95E26]" />
                              <span>PDF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => exportarBilhete('png')}
                              className="w-full px-4 py-3 text-left text-xs font-semibold text-[#F7F7F5] hover:bg-[#B95E26]/15 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-[#F7F7F5]/10"
                            >
                              <ImageIcon className="w-4 h-4 text-[#B95E26]" />
                              <span>PNG</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <button
                      type="button"
                      onClick={partilharBilhete}
                      className="px-5 py-3 border border-[#F7F7F5]/20 hover:border-[#B95E26] text-xs font-bold uppercase tracking-wider text-[#A2A09A] hover:text-[#F7F7F5] transition-colors inline-flex items-center gap-2 cursor-pointer"
                    >
                      {partilhado ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                      <span>{partilhado ? 'Link copiado' : 'Partilhar'}</span>
                    </button>

                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Garanti a minha vaga! Inscreve-te também: ${window.location.origin}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-5 py-3 bg-[#B95E26] hover:bg-[#a3511f] text-[#F7F7F5] font-bold text-xs uppercase tracking-wider inline-flex items-center gap-2 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Partilhar no WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="px-5 py-3 border border-[#F7F7F5]/20 hover:border-[#B95E26] text-xs font-bold uppercase tracking-wider text-[#A2A09A] hover:text-[#F7F7F5] transition-colors cursor-pointer"
                    >
                      Inscrever Outra Pessoa
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}

function ModernaField({
  label,
  htmlFor,
  required = false,
  help,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  help?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between text-xs font-semibold text-[#E5E3DD]"
      >
        <span>
          {label} {required && <span className="text-[#B95E26]">*</span>}
        </span>
        {help && (
          <span className="font-[family-name:var(--font-caverna-mono)] text-[10px] text-[#8D8B84]">
            {help}
          </span>
        )}
      </label>
      {children}
      {error && <p className="text-xs text-[#B95E26]">{error}</p>}
    </div>
  );
}
