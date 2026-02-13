const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function populateBenInfluences() {
  console.log('🎯 Populating Ben Schaffer influences...\n');

  // Use the latest Ben Schaffer identity (bd36bd06-0088-402f-9c76-5fde23f318b8)
  const identity = {
    id: 'bd36bd06-0088-402f-9c76-5fde23f318b8',
    name: 'Ben Schaffer'
  };
  
  console.log(`✅ Using identity: ${identity.name} (${identity.id})\n`);

  // Get categories
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .eq('identity_id', identity.id);

  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Define key influences for each category
  const influences = [
    // Music
    { category: 'music_influences', items: [
      { name: 'Radiohead', alignment: 100, notes: 'All-time favorite' },
      { name: 'Portishead', alignment: 100, notes: 'Trip-hop perfection' },
      { name: 'Michael Kiwanuka', alignment: 100, notes: 'Soulful, introspective' },
      { name: 'The Roots', alignment: 100, notes: 'Hip-hop excellence' },
      { name: 'Frank Ocean', alignment: 100, notes: 'Modern R&B genius' },
      { name: 'Anderson .Paak', alignment: 100, notes: 'Genre-blending virtuoso' },
      { name: 'Pink Floyd', alignment: 85, notes: 'Classic progressive rock' },
      { name: 'Khruangbin', alignment: 85, notes: 'Psychedelic funk' },
      { name: 'J Dilla', alignment: 80, notes: 'Producer genius' },
      { name: 'Kendrick Lamar', alignment: 80, notes: 'Modern conscious rap' }
    ]},
    // Food
    { category: 'food_preferences', items: [
      { name: 'Korean BBQ', alignment: 100, notes: 'High protein, watch sugar in sauces' },
      { name: 'Ground Lamb Kabob', alignment: 100, notes: 'Keto staple' },
      { name: 'Dark Meat Chicken', alignment: 100, notes: 'Thighs, drums - NOT white meat' },
      { name: 'BBQ Brisket', alignment: 100, notes: 'High fat, keto-friendly' },
      { name: 'Sashimi', alignment: 100, notes: 'Raw seafood lover' },
      { name: 'Japanese Food', alignment: 100, notes: 'Deep interest in culture + food' },
      { name: 'El Pollo Loco', alignment: 85, notes: 'Family meal, ALL DARK MEAT' }
    ]},
    // News
    { category: 'news_influences', items: [
      { name: 'Tesla/EV News', alignment: 100, notes: 'Unplugged Performance focus' },
      { name: 'Stock Market', alignment: 100, notes: 'Active trader, checks 6:30am daily' },
      { name: 'JDM/Automotive Culture', alignment: 100, notes: 'Bulletproof Automotive' },
      { name: 'Fleet/Commercial Vehicles', alignment: 100, notes: 'UP.FIT opportunities' },
      { name: 'Elon Musk News', alignment: 85, notes: 'Admires Elon, client connection' },
      { name: 'AI/Tech News', alignment: 85, notes: 'Building with OpenClaw' }
    ]},
    // Intellectual
    { category: 'intellectual_influences', items: [
      { name: 'Naval Ravikant', alignment: 100, notes: 'Wealth creation, philosophy' },
      { name: 'Carl Sagan', alignment: 100, notes: 'Science, wonder, humanity' },
      { name: 'Elon Musk', alignment: 100, notes: 'First principles, execution' },
      { name: 'Marcus Aurelius', alignment: 100, notes: 'Stoicism, discipline, virtue' },
      { name: 'Alan Watts', alignment: 100, notes: 'Eastern philosophy, consciousness' },
      { name: 'Peter Thiel', alignment: 85, notes: 'Zero to One, contrarian thinking' },
      { name: 'Ray Dalio', alignment: 85, notes: 'Principles, radical transparency' },
      { name: 'Ayn Rand', alignment: 85, notes: 'Objectivism, productive achievement' }
    ]},
    // Comedy
    { category: 'comedy_influences', items: [
      { name: 'Dave Chappelle', alignment: 100, notes: 'Top tier, fearless' },
      { name: 'Andrew Schulz', alignment: 100, notes: 'Edgy, crowd work master' },
      { name: 'Shane Gillis', alignment: 100, notes: 'Sharp, controversial' },
      { name: 'Joe Rogan', alignment: 100, notes: 'Client + podcast influence' }
    ]}
  ];

  let totalInfluences = 0;

  for (const categoryData of influences) {
    const categoryId = categoryMap[categoryData.category];
    if (!categoryId) {
      console.log(`⚠️  Category not found: ${categoryData.category}`);
      continue;
    }

    console.log(`\n📁 ${categoryData.category}`);
    
    for (let i = 0; i < categoryData.items.length; i++) {
      const item = categoryData.items[i];
      
      const { error: insertError } = await supabase
        .from('influences')
        .insert({
          category_id: categoryId,
          name: item.name,
          alignment: item.alignment,
          position: i,
          metadata: { notes: item.notes }
        });

      if (insertError) {
        console.error(`  ❌ Error: ${insertError.message}`);
      } else {
        totalInfluences++;
        console.log(`  ✅ ${item.name} (${item.alignment}%)`);
      }
    }
  }

  console.log(`\n🎉 Done! Added ${totalInfluences} influences to Ben Schaffer profile.`);
}

populateBenInfluences().catch(console.error);
