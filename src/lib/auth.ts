import { supabase, isSupabaseConfigured } from './supabase'

export async function signInAdmin(email: string, password: string) {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase não configurado. Contacta o administrador.')
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  
  let { data: admin, error: adminError } = await supabase
    .from('admins')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle()
  
  if (adminError) {
    console.error('[Auth] Erro ao consultar admins:', adminError)
    throw new Error(`Erro na base de dados ao verificar permissões: ${adminError.message}`)
  }

  if (!admin) {
    // Tenta sincronizar automaticamente caso seja o super_admin mestre
    try {
      const { data: syncedAdmin, error: syncError } = await supabase.rpc('sync_admin_profile')
      if (syncedAdmin) {
        admin = syncedAdmin
      } else if (syncError) {
        console.warn('[Auth] Erro no sync_admin_profile:', syncError)
      }
    } catch {
      // Ignora erro da RPC e prossegue para a verificação
    }
  }

  if (!admin) {
    throw new Error('Não autorizado. A tua conta foi autenticada, mas o teu utilizador não está registado na tabela public.admins.')
  }

  if (admin.ativo === false) {
    await supabase.auth.signOut()
    throw new Error('Conta desativada. Contacta o administrador.')
  }

  // Regista o último acesso real do administrador (mostrado em Utilizadores).
  try {
    await supabase
      .from('admins')
      .update({ ultimo_acesso: new Date().toISOString() })
      .eq('id', data.user.id)
  } catch (err) {
    console.warn('[Auth] Não foi possível actualizar o último acesso:', err)
  }

  return { user: data.user, admin }
}

export async function signOut() {
  if (!isSupabaseConfigured) return
  await supabase.auth.signOut()
}

export async function getCurrentAdmin() {
  if (!isSupabaseConfigured) return null
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) return null
  
  let { data: admin } = await supabase
    .from('admins')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle()

  if (!admin && session.user.email?.toLowerCase() === 'adilson.dev@muf.ao') {
    try {
      const { data: syncedAdmin } = await supabase.rpc('sync_admin_profile')
      if (syncedAdmin) {
        admin = syncedAdmin
      }
    } catch {
      // Ignora erro
    }
  }

  // Conta desativada: não restaura sessão no painel.
  if (admin && admin.ativo === false) return null

  return admin
}
