// Gooday — Seed de dados reais (substitui os mocks de FeedCard/StoryCarousel/GroupsRail)
//
// Uso:
//   node --env-file=.env supabase/seed/seed.mjs
//
// Requer no .env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// A service_role key ignora RLS — nunca rode este script fora de ambiente confiável.

import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !serviceKey) {
  console.error('❌ Defina VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env antes de rodar o seed.')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const picsum = (seed, w = 800, h = 600) => `https://picsum.photos/seed/${seed}/${w}/${h}`

const DEMO_USERS = [
  { email: 'maria.silva@gooday.demo', password: 'gooday123', name: 'Maria Silva', handle: 'maria_silva' },
  { email: 'joao.santos@gooday.demo', password: 'gooday123', name: 'João Santos', handle: 'joao_santos' },
  { email: 'ana.costa@gooday.demo', password: 'gooday123', name: 'Ana Costa', handle: 'ana_costa' },
  { email: 'pedro.lima@gooday.demo', password: 'gooday123', name: 'Pedro Lima', handle: 'pedro_lima' },
]

const DEMO_GROUPS = [
  { name: 'Corrida de Rua', slug: 'corrida-de-rua', description: 'Para quem ama correr ao ar livre.' },
  { name: 'Yoga & Bem-estar', slug: 'yoga-bem-estar', description: 'Práticas de yoga e mindfulness.' },
  { name: 'Nutrição Saudável', slug: 'nutricao-saudavel', description: 'Receitas e dicas de alimentação.' },
]

const DEMO_POSTS = [
  'Que dia lindo para aproveitar a praia! 🌊',
  'Novo projeto finalizado com sucesso! 🎉',
  'Explorando novos rumos na carreira! ✨',
  'Treino de hoje concluído, energia lá em cima 💪',
]

async function upsertUser(user) {
  const { data: existing } = await supabase.auth.admin.listUsers()
  const found = existing.users.find(u => u.email === user.email)
  if (found) return found.id

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { name: user.name, handle: user.handle },
  })

  if (error) throw new Error(`Erro ao criar ${user.email}: ${error.message}`)
  return data.user.id
}

async function main() {
  console.log('🌱 Criando usuários demo...')
  const userIds = []
  for (const user of DEMO_USERS) {
    const id = await upsertUser(user)
    userIds.push(id)
    console.log(`  ✓ ${user.name} (${id})`)
  }

  console.log('🖼  Atualizando avatares dos perfis...')
  for (let i = 0; i < userIds.length; i++) {
    await supabase
      .from('profiles')
      .update({ avatar_url: picsum(`avatar-${i}`, 200, 200), is_verified: i === 0 })
      .eq('id', userIds[i])
  }

  console.log('🤝 Criando relações de follow...')
  for (let i = 0; i < userIds.length; i++) {
    for (let j = 0; j < userIds.length; j++) {
      if (i !== j && Math.random() > 0.3) {
        await supabase.from('follows').insert({ follower_id: userIds[i], following_id: userIds[j] })
      }
    }
  }

  console.log('👥 Criando grupos...')
  const groupIds = []
  for (const [idx, group] of DEMO_GROUPS.entries()) {
    const { data, error } = await supabase
      .from('groups')
      .insert({ ...group, avatar_url: picsum(`group-${idx}`, 200, 200), privacy: 'PUBLIC' })
      .select('id')
      .single()
    if (error) {
      console.warn(`  ⚠ grupo "${group.name}" já existe ou falhou: ${error.message}`)
      continue
    }
    groupIds.push(data.id)
    await supabase.from('group_members').insert({ group_id: data.id, user_id: userIds[idx % userIds.length], role: 'OWNER' })
    console.log(`  ✓ ${group.name}`)
  }

  console.log('📝 Criando posts com mídia...')
  for (const [idx, body] of DEMO_POSTS.entries()) {
    const authorId = userIds[idx % userIds.length]
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({ author_id: authorId, body, audience: 'PUBLIC' })
      .select('id')
      .single()

    if (postError) {
      console.warn(`  ⚠ post falhou: ${postError.message}`)
      continue
    }

    const { data: media, error: mediaError } = await supabase
      .from('media')
      .insert({ uploader_id: authorId, url: picsum(`post-${idx}`, 800, 600), type: 'IMAGE' })
      .select('id')
      .single()

    if (!mediaError && media) {
      await supabase.from('post_media').insert({ post_id: post.id, media_id: media.id, order: 0 })
    }

    console.log(`  ✓ post de ${DEMO_USERS[idx % DEMO_USERS.length].name}`)
  }

  console.log('🎬 Criando stories ativos...')
  for (let i = 0; i < userIds.length; i++) {
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .insert({ author_id: userIds[i], status: 'ACTIVE' })
      .select('id')
      .single()

    if (!storyError && story) {
      await supabase
        .from('media')
        .insert({ uploader_id: userIds[i], story_id: story.id, url: picsum(`story-${i}`, 400, 700), type: 'IMAGE' })
    }
  }

  console.log('\n✅ Seed completo!')
  console.log('\nContas de teste (senha: gooday123):')
  DEMO_USERS.forEach(u => console.log(`  ${u.email}`))
}

main().catch(err => {
  console.error('❌ Seed falhou:', err.message)
  process.exit(1)
})
