import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export interface BilheteEvento {
  data?: string;
  horario?: string;
  local?: string;
}

export interface BilheteProps {
  nome: string;
  telefone?: string | null;
  email?: string | null;
  igreja?: string | null;
  municipio?: string | null;
  faixaEtaria?: string | null;
  numeroInscricao?: string | null;
  /** Valor codificado no QR Code (ex: MDF2026|CODIGO|NOME) */
  qrValue: string;
  evento?: BilheteEvento;
  className?: string;
}

function Campo({ label, value, destaque = false }: { label: string; value?: string | null; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <p
        className="uppercase tracking-[0.18em] text-[#E08A4A]"
        style={{ fontSize: '0.95cqw', fontFamily: 'var(--font-caverna-body)' }}
      >
        {label}
      </p>
      <p
        className={`mt-[0.35cqw] leading-tight text-[#F7F7F5] truncate ${destaque ? 'font-normal' : 'font-medium'}`}
        style={{
          fontSize: destaque ? '2.9cqw' : '1.45cqw',
          fontFamily: destaque ? 'var(--font-moderna-display)' : 'var(--font-caverna-body)',
        }}
      >
        {value || '--'}
      </p>
    </div>
  );
}

/**
 * Bilhete de inscrição — renderiza public/images/bilhete.jpg (2400×867)
 * com os dados da inscrita sobrepostos.
 * Coordenadas medidas na imagem:
 *  - Caixa branca (QR):  x 1126–1559  → left 46.9% → 65.0%
 *                         y  201–663  → top  23.2% → 76.5%
 *  - Lado esquerdo (dados): x ~5.5% → 45%
 */
export default function Bilhete({
  nome,
  telefone,
  email,
  igreja,
  municipio,
  faixaEtaria,
  numeroInscricao,
  qrValue,
  evento,
  className = '',
}: BilheteProps) {
  return (
    <div
      className={`relative w-full select-none ${className}`}
      style={{ aspectRatio: '2400 / 867', containerType: 'inline-size' }}
    >
      <img
        src="/images/bilhete.jpg"
        alt="Bilhete de inscrição"
        className="absolute inset-0 w-full h-full object-fill"
        draggable={false}
        decoding="async"
      />

      {/* Lado esquerdo — dados da inscrita */}
      <div
        className="absolute flex flex-col justify-between"
        style={{ left: '5.5%', top: '18%', width: '40%', height: '66%' }}
      >
        <div className="space-y-[1.8cqw]">
          <Campo label="Nome" value={nome} destaque />
          <div className="grid grid-cols-2 gap-x-[3cqw] gap-y-[1.8cqw]">
            <Campo label="Telefone / WhatsApp" value={telefone} />
            <Campo label="E-mail" value={email} />
            <Campo label="Igreja / Comunidade" value={igreja} />
            <Campo label="Município" value={municipio} />
            <Campo label="Faixa Etária" value={faixaEtaria} />
            <Campo label="Nº Inscrição" value={numeroInscricao} />
          </div>
        </div>

        {evento && (evento.data || evento.horario || evento.local) && (
          <div
            className="border-t border-[#F7F7F5]/15 pt-[1cqw] flex flex-wrap gap-x-[3cqw] gap-y-[0.6cqw]"
            style={{ fontFamily: 'var(--font-caverna-body)' }}
          >
            {evento.data && (
              <span className="text-[#8D8B84] uppercase tracking-[0.15em]" style={{ fontSize: '1.15cqw' }}>
                {evento.data}
              </span>
            )}
            {evento.horario && (
              <span className="text-[#8D8B84] uppercase tracking-[0.15em]" style={{ fontSize: '1.15cqw' }}>
                {evento.horario}
              </span>
            )}
            {evento.local && (
              <span className="text-[#E08A4A] uppercase tracking-[0.15em] font-semibold" style={{ fontSize: '1.15cqw' }}>
                {evento.local}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Caixa branca — QR Code */}
      <div
        className="absolute flex items-center justify-center"
        style={{ left: '46.9%', top: '23.2%', width: '18.1%', height: '53.3%' }}
      >
        <QRCodeSVG
          value={qrValue}
          size={220}
          bgColor="#FFFFFF"
          fgColor="#0B0B0A"
          level="M"
          className="w-[62%] h-auto block"
          style={{ maxWidth: 'none' }}
        />
      </div>
    </div>
  );
}
