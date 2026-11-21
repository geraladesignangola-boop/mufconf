import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Shield } from 'lucide-react'
import { usePageMeta } from '../hooks/usePageMeta'
import { useSecaoTexto } from '../hooks/useSecaoTexto'

const SECOES_FIXAS = [
  {
    numero: '1',
    titulo: 'Sobre o Evento',
    descricao:
      'A Conferência Explosão Profética "Mulheres de Fogo" — 2ª Edição é um evento de conferência e formação feminina, organizado pela Women Experience (WEX), que ocorrerá no dia 5 de Dezembro de 2026, no Talatona Shopping, Luanda, Angola. A participação é gratuita.',
  },
  {
    numero: '2',
    titulo: 'Inscrição',
    descricao:
      'Ao inscrever-se no evento, o utilizador declara que:\n• Tem 18 anos ou mais;\n• Forneceu informações verdadeiras e exatas;\n• Deseja comparecer voluntariamente ao evento;\n• Autoriza o contacto via WhatsApp e chamadas telefónicas para fins relacionados ao evento.',
  },
  {
    numero: '3',
    titulo: 'Dados Pessoais',
    descricao:
      'Os dados pessoais recolhidos (nome, email, telefone, WhatsApp, morada) são utilizados exclusivamente para:\n• Gestão de inscrições e organização do evento;\n• Contacto de suporte e informações sobre o evento;\n• Envio de notificações relacionadas com o sistema de referrals e prémios.\n\nOs dados não são partilhados com terceiros para fins de marketing.',
  },
  {
    numero: '4',
    titulo: 'Sistema de Referrals',
    descricao:
      'O sistema de referrals é voluntário. Ao partilhar o seu link exclusivo, o utilizador autoriza que o seu nome seja exibido publicamente no ranking de convidadoras. O pódio final é apurado pelo total de convidadas no encerramento da campanha e os prémios são entregues presencialmente no dia do evento, mediante apresentação da notificação.',
  },
  {
    numero: '5',
    titulo: 'Cancelamento',
    descricao:
      'O utilizador pode solicitar a remoção dos seus dados pessoais contactando o email {email}. A remoção será processada em até 7 dias úteis.',
  },
  {
    numero: '6',
    titulo: 'Contacto',
    descricao: '',
  },
]

export default function TermosPage() {
  usePageMeta({
    title: 'Termos de Participação & Privacidade — Mulheres de Fogo',
    description: 'Termos de participação e política de privacidade da Conferência Explosão Profética Mulheres de Fogo — 2ª Edição, Luanda.',
    path: '/termos',
  })

  const textoTermos = useSecaoTexto('termos')
  const campos = textoTermos?.campos || {}
  const emailContacto = campos.email_contacto || 'geral@womanexperience.ao'
  const dataAtualizacao = campos.data_atualizacao || 'Julho 2026'

  const secoes =
    textoTermos && textoTermos.itens.length > 0
      ? textoTermos.itens.map((item) => ({
          numero: item.numero || '',
          titulo: item.titulo,
          descricao: item.descricao,
        }))
      : SECOES_FIXAS

  return (
    <div className="min-h-screen bg-[var(--wex-dark-block)] text-[var(--wex-on-dark)] py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-[#A2A09A] hover:text-[#B95E26] text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar à página principal
        </Link>

        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-6 h-6 text-[#B95E26]" />
          <div>
            <h1 className="text-2xl font-bold font-serif text-[var(--wex-on-dark)]">
              {textoTermos?.titulo || 'Termos de Participação & Política de Privacidade'}
            </h1>
            {textoTermos?.subtitulo && (
              <p className="text-sm text-[#A2A09A] mt-1">{textoTermos.subtitulo}</p>
            )}
          </div>
        </div>

        {textoTermos?.descricao && (
          <p className="text-sm text-[#A2A09A] leading-relaxed mb-8 whitespace-pre-line">
            {textoTermos.descricao}
          </p>
        )}

        <div className="space-y-8 text-sm text-[#A2A09A] leading-relaxed">
          {secoes.map((secao, idx) => {
            const descricao = secao.descricao.replace('{email}', emailContacto)
            const ehContacto =
              !descricao && secao.titulo.toLowerCase().includes('contact')
            return (
              <section key={idx}>
                <h2 className="text-lg font-bold text-[#F7F7F5] mb-3">
                  {secao.numero ? `${secao.numero}. ` : ''}
                  {secao.titulo}
                </h2>
                {ehContacto ? (
                  <p>
                    Para questões sobre privacidade ou dados pessoais:{' '}
                    <a
                      href={`mailto:${emailContacto}`}
                      className="text-[#B95E26] hover:text-[#F7F7F5] ml-1"
                    >
                      {emailContacto}
                    </a>
                  </p>
                ) : (
                  <p className="whitespace-pre-line">{descricao}</p>
                )}
              </section>
            )
          })}

          <p className="text-xs text-[#8D8B84] pt-4 border-t border-[#F7F7F5]/10">
            Última actualização: {dataAtualizacao}
          </p>
        </div>
      </motion.div>
    </div>
  )
}
