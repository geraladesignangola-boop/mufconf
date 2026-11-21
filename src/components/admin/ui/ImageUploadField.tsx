import React, { useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, Upload, X, AlertTriangle } from 'lucide-react'
import { uploadImagem, TAMANHO_MAXIMO_MB } from '../../../services/adminStorageService'
import { fieldClasses, labelClasses } from './Modal'

// ==============================================================================
// Campo de imagem com UPLOAD de ficheiro para o Supabase Storage.
// O campo de ligação é mantido apenas como alternativa manual (imagens já
// existentes ou de domínios externos).
// ==============================================================================

interface ImageUploadFieldProps {
  /** URL actual (guardada na tabela). */
  value: string
  /** Chamado sempre com a URL final a guardar. */
  onChange: (url: string) => void
  /** Subpasta dentro do bucket (ex.: `galeria`, `logos`, `cartaz`, `oradoras`). */
  pasta: string
  label?: string
  placeholder?: string
  id?: string
  disabled?: boolean
  /** Oculta o campo de ligação manual (apenas upload de ficheiro). */
  semLigacao?: boolean
}

export default function ImageUploadField({
  value,
  onChange,
  pasta,
  label = 'Imagem',
  placeholder = 'https://… (ligação alternativa)',
  id,
  disabled = false,
  semLigacao = false,
}: ImageUploadFieldProps) {
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const inputFileRef = useRef<HTMLInputElement>(null)

  const handleFicheiro = async (event: any) => {
    const ficheiro: File | undefined = event.target.files?.[0]
    // Permite voltar a escolher o mesmo ficheiro depois de uma falha.
    event.target.value = ''
    if (!ficheiro) return

    setErro('')
    setCarregando(true)
    try {
      const url = await uploadImagem(ficheiro, pasta)
      onChange(url)
    } catch (err) {
      setErro((err as Error).message || 'Não foi possível carregar a imagem.')
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className={labelClasses} htmlFor={id}>
        {label}
      </label>

      {/* Pré-visualização + acção de upload */}
      <div className="flex items-start gap-3">
        {value ? (
          <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border border-slate-700 bg-slate-950">
            <img
              src={value}
              alt="Pré-visualização"
              className="w-full h-full object-cover"
              onError={(e) => {
                ;(e.target as HTMLImageElement).style.opacity = '0'
              }}
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onChange('')}
                aria-label="Remover imagem selecionada"
                title="Remover imagem"
                className="absolute top-1 right-1 p-1 rounded-md bg-slate-950/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="w-20 h-20 flex-shrink-0 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-slate-600" />
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-1.5">
          <button
            type="button"
            disabled={disabled || carregando}
            onClick={() => inputFileRef.current?.click()}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl hover:border-cyan-400/50 hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {carregando ? (
              <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            ) : (
              <Upload className="w-4 h-4 flex-shrink-0" />
            )}
            {carregando ? 'A carregar para o Supabase…' : value ? 'Substituir imagem' : 'Carregar imagem'}
          </button>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            JPEG, PNG, WebP, GIF, AVIF ou SVG até {TAMANHO_MAXIMO_MB} MB · guardada no Supabase Storage.
          </p>
        </div>

        <input
          ref={inputFileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/svg+xml"
          onChange={handleFicheiro}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {/* Alternativa manual por ligação */}
      {!semLigacao && (
        <input
          id={id}
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || carregando}
          className={fieldClasses}
        />
      )}

      {erro && (
        <p className="flex items-start gap-2 text-xs text-red-300">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
          {erro}
        </p>
      )}
    </div>
  )
}
