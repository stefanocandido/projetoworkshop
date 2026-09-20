#!/usr/bin/env bash
# Gooday — aplica todas as migrations em ordem no banco do Supabase.
# Requer DATABASE_URL no .env (Settings → Database → Connection string → URI).
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env ]; then
  export $(grep -v '^#' .env | grep DATABASE_URL | xargs)
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL não definida. Preencha o .env com a connection string do Supabase (Settings → Database)."
  exit 1
fi

if ! command -v psql &> /dev/null; then
  echo "❌ psql não encontrado. Instale com: brew install libpq && brew link --force libpq"
  exit 1
fi

for f in supabase/migrations/*.sql; do
  echo "▶ Aplicando $f..."
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done

echo "✅ Todas as migrations foram aplicadas."
