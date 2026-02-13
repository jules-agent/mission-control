#!/bin/bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

echo "🔄 Trying Supabase connection..."

# Try different connection patterns
PASSWORDS=("vK88OfddlsaH62vm")
HOSTS=(
  "db.nqikobnkhpyfduqgfrew.supabase.co:5432"
  "aws-0-us-west-1.pooler.supabase.com:5432"
  "nqikobnkhpyfduqgfrew.supabase.co:5432"
)

for host in "${HOSTS[@]}"; do
  for password in "${PASSWORDS[@]}"; do
    echo "Trying postgresql://postgres:***@${host}/postgres"
    if psql "postgresql://postgres:${password}@${host}/postgres" -c "SELECT 1" 2>/dev/null; then
      echo "✅ Connected! Running migration..."
      psql "postgresql://postgres:${password}@${host}/postgres" -f supabase/migrations/20260213_master_identity_system.sql
      exit $?
    fi
  done
done

echo "❌ Could not connect with any combination"
exit 1
