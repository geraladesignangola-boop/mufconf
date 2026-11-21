import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ==============================================================================
// Serviço de upload de imagens para o Supabase Storage (bucket `wex-media`).
// Substitui a introdução manual de links: o ficheiro é enviado diretamente
// para o Supabase e devolvida a URL pública para guardar na tabela.
// ==============================================================================

const BUCKET_IMAGENS = 'wex-media';

export const TAMANHO_MAXIMO_MB = 5;

const MIME_IMAGENS = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'image/svg+xml',
];

const MIME_DOCUMENTOS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'text/plain',
];

const TAMANHO_MAXIMO_FICHEIRO_MB = 20;

function assertConfigurado() {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Verifica as variáveis de ambiente.');
  }
}

function extensaoValida(file: File): string {
  const parte = file.name.split('.').pop() || '';
  const ext = parte.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(jpe?g|png|webp|gif|avif|svg)$/.test(ext)) {
    return ext === 'jpeg' ? 'jpg' : ext;
  }
  // Se a extensão for inválida, deriva do MIME.
  const mapa: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
  };
  return mapa[file.type] || 'jpg';
}

/**
 * Envia uma imagem para o bucket `wex-media` e devolve a URL pública.
 * Lança erro com mensagem legível para o operador.
 */
export async function uploadImagem(file: File, pasta: string): Promise<string> {
  assertConfigurado();

  if (!file.type || !MIME_IMAGENS.includes(file.type)) {
    throw new Error('Formato não suportado. Usa JPEG, PNG, WebP, GIF, AVIF ou SVG.');
  }

  if (file.size > TAMANHO_MAXIMO_MB * 1024 * 1024) {
    throw new Error(`Imagem demasiado grande (máx. ${TAMANHO_MAXIMO_MB} MB).`);
  }

  const destino = pasta.trim().replace(/^\/+|\/+$/g, '');
  const caminho = `${destino ? `${destino}/` : ''}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensaoValida(file)}`;

  const { error } = await supabase.storage.from(BUCKET_IMAGENS).upload(caminho, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Não foi possível carregar a imagem: ${error.message}`);
  }

  return urlPublica(caminho);
}

function extensaoDocumentoValida(file: File): string {
  const parte = file.name.split('.').pop() || '';
  const ext = parte.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (/^(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|txt)$/.test(ext)) return ext;

  const mapa: Record<string, string> = {
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'application/vnd.ms-powerpoint': 'ppt',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
    'application/zip': 'zip',
    'text/plain': 'txt',
  };
  return mapa[file.type] || 'bin';
}

/**
 * Envia um documento (PDF, Office, ZIP, etc.) para o bucket `wex-media`
 * e devolve a URL pública. Usado pela secção "Materiais & Atalhos".
 */
export async function uploadFicheiro(file: File, pasta: string): Promise<string> {
  assertConfigurado();

  const ext = extensaoDocumentoValida(file);
  const extValida = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'txt'].includes(ext);
  if (!extValida && (!file.type || !MIME_DOCUMENTOS.includes(file.type))) {
    throw new Error('Formato não suportado. Usa PDF, Word, Excel, PowerPoint, ZIP ou TXT.');
  }

  if (file.size > TAMANHO_MAXIMO_FICHEIRO_MB * 1024 * 1024) {
    throw new Error(`Ficheiro demasiado grande (máx. ${TAMANHO_MAXIMO_FICHEIRO_MB} MB).`);
  }

  const destino = pasta.trim().replace(/^\/+|\/+$/g, '');
  const caminho = `${destino ? `${destino}/` : ''}${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extensaoDocumentoValida(file)}`;

  const { error } = await supabase.storage.from(BUCKET_IMAGENS).upload(caminho, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) {
    throw new Error(`Não foi possível carregar o ficheiro: ${error.message}`);
  }

  return urlPublica(caminho);
}

/** URL pública de um caminho dentro do bucket. */
function urlPublica(caminho: string): string {
  return supabase.storage.from(BUCKET_IMAGENS).getPublicUrl(caminho).data.publicUrl;
}

/**
 * Extrai o caminho interno de uma URL pública do bucket.
 * Devolve `null` para URLs externas (não geridas por este projeto).
 */
function extrairCaminho(url: string): string | null {
  if (!url) return null;
  const marcador = `/object/public/${BUCKET_IMAGENS}/`;
  const indice = url.indexOf(marcador);
  if (indice === -1) return null;
  const resto = url.slice(indice + marcador.length).split('?')[0];
  try {
    return decodeURIComponent(resto);
  } catch {
    return resto;
  }
}

/**
 * Remove a imagem do bucket a partir da URL guardada (best-effort).
 * URLs externas e falhas de remoção são ignoradas silenciosamente — o registo
 * em base de dados já foi apagado e não deve ficar bloqueado por isso.
 */
export async function removerImagem(url: string): Promise<void> {
  const caminho = extrairCaminho(url);
  if (!caminho || !isSupabaseConfigured) return;

  try {
    const { error } = await supabase.storage.from(BUCKET_IMAGENS).remove([caminho]);
    if (error) {
      console.warn('[Storage] Não foi possível remover a imagem:', error.message);
    }
  } catch (err) {
    console.warn('[Storage] Não foi possível remover a imagem:', err);
  }
}
