#!/bin/bash

echo "🔄 Master Identity System Migration"
echo ""

# Copy migration SQL to clipboard
cat "$(dirname "$0")/../supabase/migrations/20260213_master_identity_system.sql" | pbcopy

echo "✅ Migration SQL copied to clipboard"
echo ""
echo "📋 NEXT STEPS:"
echo "   1. Browser window should be open to Supabase SQL Editor"
echo "   2. Click in the SQL editor text area"
echo "   3. Press Cmd+A to select all, then Cmd+V to paste"
echo "   4. Click the green 'RUN' button"
echo ""
echo "⏳ Waiting for you to complete these steps..."
echo "   (Press Enter when done to verify tables were created)"
read

echo ""
echo "🔍 Verifying migration..."
node "$(dirname "$0")/verify-migration.js"

if [ $? -eq 0 ]; then
  echo ""
  echo "🎉 Migration complete! Ready to build UI."
else
  echo ""
  echo "⚠️  Tables not found. Please try again or check for errors in Supabase."
  exit 1
fi
