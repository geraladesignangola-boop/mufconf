export function useReferral() {
  const generateReferralCode = (nome: string): string => {
    const cleanName = nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')

    const randomSuffix = crypto.randomUUID().replace(/-/g, '').substring(0, 8)
    return `${cleanName.substring(0, 20)}-${randomSuffix}`
  }

  const getReferralLink = (code: string, source: string = 'direct'): string => {
    const configuredUrl = import.meta.env.VITE_APP_URL
    const baseUrl = configuredUrl && !configuredUrl.includes('localhost')
      ? configuredUrl
      : window.location.origin
    const referralUrl = new URL('/convite', baseUrl)
    referralUrl.searchParams.set('ref', code)
    referralUrl.searchParams.set('src', source)
    return referralUrl.toString()
  }

  return {
    generateReferralCode,
    getReferralLink,
  }
}
