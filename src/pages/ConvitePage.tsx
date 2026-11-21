import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Flame, ImageOff, RefreshCw, UserPlus } from 'lucide-react'
import ModernaLogisticaInscricao from '../components/moderna/ModernaLogisticaInscricao'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { ReferrerInfo } from '../types/database'
import { Skeleton } from '../components/ui/Skeleton'
import { usePageMeta } from '../hooks/usePageMeta'

export default function ConvitePage() {
  const [searchParams] = useSearchParams()
  const refCode = searchParams.get('ref')
  const source = searchParams.get('src') || 'direct'
  const [referrer, setReferrer] = useState<ReferrerInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoggedClick = useRef(false)

  // Links de convite são pessoais — não devem ser indexados
  usePageMeta({
    title: 'Convite — Conferência Explosão Profética Mulheres de Fogo',
    description: 'Foste convidada para a Conferência Explosão Profética Mulheres de Fogo — 2ª Edição, Luanda, 5 de Dezembro de 2026.',
    path: '/convite',
    noindex: true,
  })

  const fetchReferrer = useCallback(async () => {
    setLoading(true)
    setError(null)

    if (!refCode || !isSupabaseConfigured) {
      setLoading(false)
      if (!refCode) setError('Este link de convite não é válido.')
      return
    }

    try {
      const { data, error } = await supabase.rpc('get_public_referrer_by_code', {
        ref_code: refCode,
      })

      const foundReferrer = data?.[0] ?? null
      if (error || !foundReferrer) {
        throw new Error('not_found')
      }

      setReferrer(foundReferrer)

      if (!hasLoggedClick.current) {
        hasLoggedClick.current = true
        try {
          await supabase.rpc('log_referral_link_click', {
            ref_code: refCode,
            p_source: source,
            p_user_agent: navigator.userAgent,
          })
        } catch (clickError) {
          console.warn('Não foi possível registar o clique do link.', clickError)
        }
      }
    } catch {
      setError('Código de convite inválido ou expirado')
    } finally {
      setLoading(false)
    }
  }, [refCode, source])

  useEffect(() => {
    fetchReferrer()
  }, [fetchReferrer])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--wex-dark-block)] px-4 py-12">
        <div className="max-w-xl mx-auto space-y-6">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-9 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-64 w-full mt-10" />
        </div>
      </div>
    )
  }

  if (!isSupabaseConfigured) {
    return (
      <div className="min-h-screen bg-[var(--wex-dark-block)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Flame className="w-12 h-12 text-[#B95E26] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[var(--wex-on-dark)] font-[family-name:var(--font-moderna-display)] mb-2">
            Configuração em falta
          </h1>
          <p className="text-[#A2A09A] text-sm mb-6">
            As variáveis de ambiente do Supabase não estão configuradas. Contacta o administrador.
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-[#F7F7F5] text-[#0B0B0A] font-bold text-xs uppercase tracking-wider"
          >
            Voltar à página principal
          </a>
        </div>
      </div>
    )
  }

  if (error || !refCode) {
    const invalido = !refCode
    return (
      <div className="min-h-screen bg-[var(--wex-dark-block)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          {invalido ? (
            <ImageOff className="w-12 h-12 text-[#B95E26] mx-auto mb-4" />
          ) : (
            <Flame className="w-12 h-12 text-[#B95E26] mx-auto mb-4" />
          )}
          <h1 className="text-2xl font-bold text-[var(--wex-on-dark)] font-[family-name:var(--font-moderna-display)] mb-2">
            {invalido ? 'Link inválido' : 'Não foi possível carregar'}
          </h1>
          <p className="text-[#A2A09A] text-sm">
            {error || 'Este link de convite não é válido.'}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {!invalido && (
              <button
                type="button"
                onClick={fetchReferrer}
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#F7F7F5] text-[#0B0B0A] font-bold text-xs uppercase tracking-wider hover:bg-[#B95E26] hover:text-[#F7F7F5] transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </button>
            )}
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 border border-[#F7F7F5]/20 text-[#A2A09A] hover:text-[var(--wex-on-dark)] hover:border-[#B95E26] font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Página principal
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--wex-dark-block)] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl mx-auto mb-8 text-center"
      >
        <div className="inline-flex p-4 bg-[#B95E26]/10 border border-[#B95E26]/25 rounded-full mb-4">
          <UserPlus className="w-8 h-8 text-[#B95E26]" />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-[var(--wex-on-dark)] font-[family-name:var(--font-moderna-display)]">
          {referrer?.nome} convidou-te!
        </h1>

        <p className="mt-3 text-[#A2A09A] text-sm">
          Junta-te a ela na Conferência Explosão Profética Mulheres de Fogo
        </p>

        {referrer && (
          <div className="mt-4 space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F7F7F5]/5 border border-[#F7F7F5]/10 text-xs text-[#A2A09A]">
              <span>Total de convidadas:</span>
              <span className="font-bold text-[#B95E26]">{referrer.convidadas_count}</span>
            </div>

            <div className="flex flex-wrap justify-center gap-2 text-[10px] text-[#8D8B84]">
              <span className="px-3 py-1 rounded-full bg-[#F7F7F5]/5 border border-[#F7F7F5]/10">
                Cliques: {referrer.total_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F7F7F5]/5 border border-[#F7F7F5]/10">
                WhatsApp: {referrer.whatsapp_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F7F7F5]/5 border border-[#F7F7F5]/10">
                Facebook: {referrer.facebook_clicks ?? 0}
              </span>
              <span className="px-3 py-1 rounded-full bg-[#F7F7F5]/5 border border-[#F7F7F5]/10">
                Instagram: {referrer.instagram_clicks ?? 0}
              </span>
            </div>
          </div>
        )}

        <p className="mt-4 text-[11px] text-[#8D8B84]">
          O pódio final é definido pelo total de convidadas no encerramento da campanha.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <ModernaLogisticaInscricao referredByCode={refCode} mostrarLogistica={false} />
      </motion.div>
    </div>
  )
}
