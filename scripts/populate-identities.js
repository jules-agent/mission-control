const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateIdentities() {
  console.log('🎯 Populating Master Identity System with 3 profiles...\n');

  // Load profiles
  const benProfile = JSON.parse(fs.readFileSync(path.join(__dirname, '../../output/identity-ben-schaffer.json'), 'utf8'));
  const obamaProfile = JSON.parse(fs.readFileSync(path.join(__dirname, '../../output/identity-barack-obama.json'), 'utf8'));
  const muskProfile = JSON.parse(fs.readFileSync(path.join(__dirname, '../../output/identity-elon-musk.json'), 'utf8'));

  // For templates, use NULL user_id since they're not tied to an auth user
  // For Ben, we'd need his actual auth.users UUID - for now using NULL for all
  const profiles = [
    { name: 'Ben Schaffer', data: benProfile, userId: null, isBase: true },
    { name: 'Barack Obama', data: obamaProfile, userId: null, isBase: true },
    { name: 'Elon Musk', data: muskProfile, userId: null, isBase: true }
  ];

  for (const profile of profiles) {
    console.log(`\n📝 Creating identity: ${profile.name}`);

    // 1. Create identity
    const { data: identity, error: identityError} = await supabase
      .from('identities')
      .insert({
        user_id: profile.userId,
        name: profile.data.identity_name,
        is_base: profile.isBase,
        parent_id: null
      })
      .select()
      .single();

    if (identityError) {
      console.error(`❌ Error creating identity: ${identityError.message}`);
      continue;
    }

    console.log(`✅ Identity created: ${identity.id}`);

    // 2. Create categories and influences
    let categoryCount = 0;
    let influenceCount = 0;

    for (const [categoryName, categoryData] of Object.entries(profile.data.categories)) {
      console.log(`  📁 Category: ${categoryName}`);

      // Create category
      const { data: category, error: categoryError } = await supabase
        .from('categories')
        .insert({
          identity_id: identity.id,
          parent_id: null,
          name: categoryName,
          type: categoryData.description || categoryName,
          level: 1
        })
        .select()
        .single();

      if (categoryError) {
        console.error(`  ❌ Error creating category: ${categoryError.message}`);
        continue;
      }

      categoryCount++;

      // Create influences from alignment_scores
      if (categoryData.alignment_scores) {
        for (const [tierName, items] of Object.entries(categoryData.alignment_scores)) {
          // Extract alignment percentage from tier name
          const alignmentMatch = tierName.match(/\((\d+)%\)/);
          const alignment = alignmentMatch ? parseInt(alignmentMatch[1]) : 80;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const { error: influenceError } = await supabase
              .from('influences')
              .insert({
                category_id: category.id,
                name: item.artist || item.food || item.topic || item.person || item.comedian || item.name,
                alignment_percentage: alignment,
                position: i,
                notes: item.notes || ''
              });

            if (!influenceError) {
              influenceCount++;
            }
          }
        }
      }

      // Also handle tiers format (Obama/Musk profiles)
      if (categoryData.tiers) {
        const tierAlignments = { 'S': 100, 'A': 85, 'B': 70, 'C': 55 };
        
        for (const [tier, items] of Object.entries(categoryData.tiers)) {
          const alignment = tierAlignments[tier] || 70;

          for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const { error: influenceError } = await supabase
              .from('influences')
              .insert({
                category_id: category.id,
                name: item.name,
                alignment_percentage: alignment,
                position: i,
                notes: item.notes || ''
              });

            if (!influenceError) {
              influenceCount++;
            }
          }
        }
      }
    }

    console.log(`✅ ${profile.name}: ${categoryCount} categories, ${influenceCount} influences`);
  }

  console.log('\n🎉 Done! All 3 identities populated.');
}

populateIdentities().catch(console.error);
