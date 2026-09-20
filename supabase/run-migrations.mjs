// Gooday — aplica todas as migrations em supabase/migrations/*.sql, em ordem, via pg.
// Não depende de psql, Supabase CLI ou MCP — só precisa de DATABASE_URL no .env.
//
// Uso: node --env-file=.env supabase/run-migrations.mjs

import { readdirSync, readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const migrationsDir = join(__dirname, 'migrations')

const databaseUrl = process.env.DATABASE_URL

if (!databaseUrl) {
  console.error('❌ DATABASE_URL não definida no .env (Settings → Database → Connection string → URI).')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  await client.connect()
  console.log('✓ Conectado ao Postgres do Supabase')

  const files = readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = readFileSync(join(migrationsDir, file), 'utf-8')
    console.log(`▶ Aplicando ${file}...`)
    try {
      await client.query(sql)
      console.log(`  ✓ ${file} aplicada`)
    } catch (err) {
      console.error(`  ❌ Falhou em ${file}: ${err.message}`)
      await client.end()
      process.exit(1)
    }
  }

  console.log('\n✅ Todas as migrations foram aplicadas com sucesso.')
  await client.end()
}

main().catch(async (err) => {
  console.error('❌ Erro inesperado:', err.message)
  await client.end().catch(() => {})
  process.exit(1)
})
