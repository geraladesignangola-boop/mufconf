import React, { useCallback, useEffect, useState } from 'react';
import { Check, ImageOff, Loader2, RefreshCw } from 'lucide-react';
import {
  fetchPublicLogoParceiros,
  fetchPublicPartnerLogos,
  submitPublicPartnerApplication,
  PublicLogoParceiro,
} from '../../services/publicDataService';
import { useSecaoTexto } from '../../hooks/useSecaoTexto';
import { useToast } from '../ui/Toast';
import { Skeleton } from '../ui/Skeleton';
import { Reveal } from '../ui/Reveal';

const COTAS = [
	{
		tier: 'Diamante',
		subtitle: 'Patrocinador principal',
		benefits: 'Destaque no cartaz oficial, stand exclusivo no Centro de Convenções Talatona e menção nas sessões plenárias.',
	},
	{
		tier: 'Ouro',
		subtitle: 'Apoio institucional',
		benefits: 'Logótipo em materiais impressos, projeção digital durante a programação e credenciamento especial.',
	},
	{
		tier: 'Prata',
		subtitle: 'Parceiro de experiência',
		benefits: 'Apoio direto aos kits de acolhimento, materiais de receção ou pausas para café e networking.',
	},
];

const inputStyle =
	'w-full bg-[var(--wex-surface)] border border-[var(--wex-line)]/16 focus:border-[#B95E26] text-[var(--wex-ink)] px-4 py-3 text-sm focus:outline-none transition-colors placeholder-[var(--wex-muted-2)]';

export default function ModernaParcerias() {
	// A chave gravada na tabela secoes_conteudo é "parcerias" (ver migração 015)
	const texto = useSecaoTexto('parcerias');
	const [logos, setLogos] = useState<PublicLogoParceiro[]>([]);
	const [logosRotos, setLogosRotos] = useState<Record<string, boolean>>({});
	const [logosEstado, setLogosEstado] = useState<'loading' | 'ok' | 'error' | 'vazio'>('loading');
	const [empresa, setEmpresa] = useState('');
	const [responsavel, setResponsavel] = useState('');
	const [contacto, setContacto] = useState('');
	const [categoria, setCategoria] = useState<'Diamante' | 'Ouro' | 'Prata'>('Diamante');
	const [mensagem, setMensagem] = useState('');
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [error, setError] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [sent, setSent] = useState(false);
	const { toast } = useToast();

	const carregarLogos = useCallback(async () => {
		setLogosEstado('loading');
		try {
			// 1. Logótipos geridos no admin (tabela logos_parceiros)
			const liveLogos = await fetchPublicLogoParceiros();
			if (liveLogos.length > 0) {
				setLogos(liveLogos);
				setLogosEstado('ok');
				return;
			}
			// 2. Fallback: nomes de parceiros confirmados
			const nomes = await fetchPublicPartnerLogos();
			if (nomes.length > 0) {
				setLogos(
					nomes.map((nome, index) => ({
						id: `parceiro-${index}`,
						nome,
						logoUrl: '',
					}))
				);
				setLogosEstado('ok');
			} else {
				setLogos([]);
				setLogosEstado('vazio');
			}
		} catch {
			setLogosEstado('error');
		}
	}, []);

	useEffect(() => {
		carregarLogos();
	}, [carregarLogos]);

	const limparErroCampo = (campo: string, valor: string) => {
		if (!fieldErrors[campo]) return;
		const prox = { ...fieldErrors };
		delete prox[campo];
		setFieldErrors(prox);
		void valor;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const novosErros: Record<string, string> = {};
		if (!empresa.trim()) novosErros.empresa = 'Indica o nome da empresa ou organização.';
		if (!responsavel.trim()) novosErros.responsavel = 'Indica o nome do responsável.';
		if (!contacto.trim()) {
			novosErros.contacto = 'Indica o telefone ou WhatsApp de contacto.';
		} else if (contacto.replace(/\D/g, '').length < 9) {
			novosErros.contacto = 'Número de contacto incompleto.';
		}
		if (Object.keys(novosErros).length > 0) {
			setFieldErrors(novosErros);
			setError('');
			toast('error', 'Preenche os campos obrigatórios para continuar.');
			return;
		}
		setFieldErrors({});
		setError('');
		setSubmitting(true);

		const res = await submitPublicPartnerApplication({
			empresa,
			responsavel,
			contacto,
			categoria,
			mensagem,
		});

		setSubmitting(false);
		if (res.success) {
			setSent(true);
			toast('success', 'Pedido de dossier registado. A comissão entrará em contacto em breve.');
		} else {
			setError(res.error || 'Erro ao submeter proposta. Tenta novamente.');
			toast('error', res.error || 'Erro ao submeter proposta. Tenta novamente.');
		}
	};

	return (
		<>
			{logosEstado === 'loading' && (
			<section className="bg-[var(--wex-surface-3)] border-y border-[var(--wex-line)]/12 py-12 sm:py-14 overflow-hidden">
				<div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
					<div className="flex overflow-hidden gap-3" aria-hidden="true">
						{Array.from({ length: 6 }).map((_, i) => (
							<Skeleton key={i} className="h-20 min-w-48 shrink-0" />
						))}
					</div>
				</div>
			</section>
			)}

			{logosEstado === 'error' && (
			<section className="bg-[var(--wex-surface-3)] border-y border-[var(--wex-line)]/12 py-8">
				<div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 flex flex-wrap items-center justify-between gap-3">
					<p className="text-xs text-[var(--wex-muted)] inline-flex items-center gap-2">
						<ImageOff className="w-4 h-4 text-[var(--wex-muted-2)]" />
						Não foi possível carregar os parceiros.
					</p>
					<button
						type="button"
						onClick={carregarLogos}
						className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--wex-line)]/20 text-[var(--wex-ink)] text-xs font-semibold uppercase tracking-wider hover:border-[#B95E26] transition-colors cursor-pointer"
					>
						<RefreshCw className="w-3.5 h-3.5" />
						Tentar novamente
					</button>
				</div>
			</section>
			)}

			{logosEstado === 'ok' && logos.length > 0 && (
			<section id="parceiros-logos" className="bg-[var(--wex-surface-3)] border-y border-[var(--wex-line)]/12 py-12 sm:py-14 overflow-hidden">
				<div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12">
					<div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-7">
						<div>
							<span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
								{texto?.titulo || 'Rede de Parceiros'}
							</span>
							<h2 className="mt-2 font-[family-name:var(--font-moderna-display)] font-bold tracking-tight text-2xl sm:text-3xl text-[var(--wex-ink)]">
								{texto?.subtitulo || texto?.titulo || 'Quem caminha connosco'}
							</h2>
						</div>
						<p className="text-sm max-w-sm text-[var(--wex-muted)] sm:text-right">
							{texto?.descricao || 'Instituições e empresas que tornam esta conferência possível.'}
						</p>
					</div>

					<div className="parceiros-marquee relative overflow-hidden py-1" role="region" aria-label="Logótipos de parceiros">
						<div className="parceiros-track flex w-max items-center">
							{[0, 1].map((group) => (
								<div key={group} className="flex shrink-0" aria-hidden={group === 1}>
									{logos.map((logo) => (
										<div
											key={`${group}-${logo.id}`}
											className="mx-2 flex h-20 min-w-48 items-center justify-center border border-[var(--wex-line)]/12 bg-white px-6"
										>
											{logo.logoUrl && !logosRotos[logo.id] ? (
												<img
													src={logo.logoUrl}
													alt={logo.nome}
													loading="lazy"
													onError={() =>
														setLogosRotos((prev) => ({ ...prev, [logo.id]: true }))
													}
													className="max-h-12 max-w-[190px] object-contain"
												/>
											) : (
												<span className="flex items-center gap-2 whitespace-nowrap font-[family-name:var(--font-caverna-mono)] text-xs font-semibold text-[#5B4A43]">
													<span className="h-2 w-2 shrink-0 rounded-full bg-gradient-to-br from-[#C9A24A] to-[#A6521F]" />
													{logo.nome}
												</span>
											)}
										</div>
									))}
								</div>
							))}
						</div>
					</div>
				</div>
			</section>
			)}

			<section id="moderna-parcerias" className="bg-[var(--wex-surface-2)] text-[var(--wex-ink)] border-b border-[var(--wex-line)]/12">
				<div className="max-w-[1360px] mx-auto px-5 sm:px-8 lg:px-12 py-20 lg:py-28">
					{/* LOGOS PARCEIROS */}

					<div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-start">
						{/* Left: Cotas de Patrocínio (6 cols) */}
						<Reveal className="lg:col-span-6 space-y-8">
							<div>
								<p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
									06 · Parcerias e Patrocínios
								</p>
								<h2 className="mt-3 font-[family-name:var(--font-moderna-display)] text-3xl sm:text-4xl font-bold tracking-tight text-[var(--wex-ink)] leading-[1.06] text-balance">
									Apoie uma conferência que transforma mulheres e comunidades.
								</h2>
								<p className="mt-4 text-sm sm:text-[15px] text-[var(--wex-muted)] leading-relaxed max-w-lg">
									Empresas e instituições podem associar a sua marca à Conferência Explosão Profética Mulheres de Fogo — 2ª Edição através das cotas indicativas abaixo.
								</p>
							</div>

							<div className="divide-y divide-[var(--wex-line)]/14 border-y border-[var(--wex-line)]/14">
								{COTAS.map((cota, idx) => (
									<div key={cota.tier} className="py-6 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-6">
										<div className="sm:col-span-4">
											<span className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] tabular-nums">
												0{idx + 1}
											</span>
											<h3 className="mt-1 font-[family-name:var(--font-moderna-display)] text-xl font-bold text-[var(--wex-ink)]">
												{cota.tier}
											</h3>
											<p className="text-xs text-[var(--wex-muted-2)] mt-0.5">{cota.subtitle}</p>
										</div>
										<p className="sm:col-span-8 text-sm text-[var(--wex-muted)] leading-relaxed">
											{cota.benefits}
										</p>
									</div>
								))}
							</div>
						</Reveal>

						{/* Right: Solicitar Dossier de Patrocínio (6 cols) */}
						<Reveal delay={120} className="lg:col-span-6 bg-[var(--wex-surface)] border border-[var(--wex-line)]/12 p-6 sm:p-9">
							<p className="font-[family-name:var(--font-caverna-mono)] text-xs text-[#B95E26] uppercase tracking-wider">
								Dossier Institucional
							</p>
							<h3 className="mt-2 font-[family-name:var(--font-moderna-display)] text-2xl font-bold text-[var(--wex-ink)]">
								Solicitar dossier de patrocínio
							</h3>
							<p className="mt-2 text-xs sm:text-sm text-[var(--wex-muted)]">
								Indica os dados da organização para receberes a proposta completa pela comissão organizadora.
							</p>

							{sent ? (
								<div className="mt-7 p-6 bg-[var(--wex-surface-2)] border border-[#B95E26]/40 space-y-3">
									<div className="flex items-center gap-2 text-[#B95E26] font-semibold text-sm">
										<Check className="w-4 h-4" />
										<span>Pedido de dossier registado</span>
									</div>
									<p className="text-sm text-[var(--wex-muted)] leading-relaxed">
										Obrigado, {responsavel}. A comissão organizadora da Conferência Explosão Profética Mulheres de Fogo — 2ª Edição entrará em contacto em breve com os detalhes da cota {categoria}.
									</p>
									<button
										type="button"
										onClick={() => {
											setSent(false);
											setEmpresa('');
											setResponsavel('');
											setContacto('');
											setMensagem('');
										}}
										className="mt-2 px-4 py-2 border border-[var(--wex-line)]/20 text-xs font-semibold uppercase tracking-wider hover:border-[var(--wex-line)] transition-colors cursor-pointer"
									>
										Enviar outro pedido
									</button>
								</div>
							) : (
								<form onSubmit={handleSubmit} className="mt-6 space-y-4">
									<div>
										<label htmlFor="pat-empresa" className="block text-xs font-semibold text-[var(--wex-ink)] mb-1.5">
											Empresa / Organização <span className="text-[#B95E26]">*</span>
										</label>
										<input
											id="pat-empresa"
											type="text"
											value={empresa}
											onChange={(e) => {
												setEmpresa(e.target.value);
												limparErroCampo('empresa', e.target.value);
											}}
											placeholder="Nome da empresa ou instituição"
											aria-invalid={Boolean(fieldErrors.empresa)}
											className={`${inputStyle} ${fieldErrors.empresa ? 'border-[#B95E26]' : ''}`}
										/>
										{fieldErrors.empresa && (
											<p className="mt-1.5 text-xs text-[#B95E26]">{fieldErrors.empresa}</p>
										)}
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div>
											<label htmlFor="pat-resp" className="block text-xs font-semibold text-[var(--wex-ink)] mb-1.5">
												Responsável <span className="text-[#B95E26]">*</span>
											</label>
											<input
												id="pat-resp"
												type="text"
												value={responsavel}
												onChange={(e) => {
													setResponsavel(e.target.value);
													limparErroCampo('responsavel', e.target.value);
												}}
												placeholder="Nome do contacto"
												aria-invalid={Boolean(fieldErrors.responsavel)}
												className={`${inputStyle} ${fieldErrors.responsavel ? 'border-[#B95E26]' : ''}`}
											/>
											{fieldErrors.responsavel && (
												<p className="mt-1.5 text-xs text-[#B95E26]">{fieldErrors.responsavel}</p>
											)}
										</div>
										<div>
											<label htmlFor="pat-tel" className="block text-xs font-semibold text-[var(--wex-ink)] mb-1.5">
												Telefone / WhatsApp <span className="text-[#B95E26]">*</span>
											</label>
											<input
												id="pat-tel"
												type="tel"
												value={contacto}
												onChange={(e) => {
													setContacto(e.target.value);
													limparErroCampo('contacto', e.target.value);
												}}
												placeholder="Ex: 923 000 000"
												aria-invalid={Boolean(fieldErrors.contacto)}
												className={`${inputStyle} ${fieldErrors.contacto ? 'border-[#B95E26]' : ''}`}
											/>
											{fieldErrors.contacto && (
												<p className="mt-1.5 text-xs text-[#B95E26]">{fieldErrors.contacto}</p>
											)}
										</div>
									</div>

									<div>
										<label htmlFor="pat-cat" className="block text-xs font-semibold text-[var(--wex-ink)] mb-1.5">
											Categoria de interesse
										</label>
										<select
											id="pat-cat"
											value={categoria}
											onChange={(e) => setCategoria(e.target.value as 'Diamante' | 'Ouro' | 'Prata')}
											className={inputStyle}
										>
											<option value="Diamante">Diamante — Patrocinador principal</option>
											<option value="Ouro">Ouro — Apoio institucional</option>
											<option value="Prata">Prata — Parceiro de experiência</option>
										</select>
									</div>

									<div>
										<label htmlFor="pat-msg" className="block text-xs font-semibold text-[var(--wex-ink)] mb-1.5">
											Mensagem
										</label>
										<textarea
											id="pat-msg"
											rows={3}
											value={mensagem}
											onChange={(e) => setMensagem(e.target.value)}
											placeholder="Indica como a tua organização gostaria de participar..."
											className={`${inputStyle} resize-none`}
										/>
									</div>

									{error && <p className="text-xs text-[#B95E26] font-medium">{error}</p>}

									<button
										type="submit"
										disabled={submitting}
										className="w-full py-3.5 bg-[var(--wex-cta-bg)] hover:bg-[#B95E26] text-[var(--wex-cta-fg)] text-xs font-semibold uppercase tracking-[0.14em] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
									>
										{submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
										<span>Solicitar Dossier de Patrocínio</span>
									</button>
								</form>
							)}
						</Reveal>
					</div>
				</div>
			</section>
		</>
	);
}
