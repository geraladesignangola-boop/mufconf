import galleryHeroImg from '../assets/images/moderna_hero_architecture_1795039044169.jpg';

/**
 * Mapa de caminhos antigos gravados na base de dados (`/assets/images/...`)
 * para os ficheiros reais do build, que são servidos com nomes com hash
 * (`/assets/<nome>-<hash>.jpg`). Sem este resolvedor, as imagens antigas
 * devolvem 404 no site publicado.
 */
const LEGACY_ASSET_PATHS: Record<string, string> = {
  '/assets/images/moderna_hero_architecture_1795039044169.jpg': galleryHeroImg,
};

/**
 * Resolve um URL de imagem vindo da base de dados.
 * Caminhos legados são trocados pelo asset do build; URLs de storage
 * (`https://...`) ou caminhos válidos (`/images/...`) são devolvidos tal e qual.
 */
export function resolveImageUrl(url?: string | null): string {
  if (!url) return '';
  const mapped = LEGACY_ASSET_PATHS[url];
  if (mapped) return mapped;
  if (url.startsWith('/assets/images/')) return '';
  return url;
}
