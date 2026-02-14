import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Identity IDs
const OBAMA_IDENTITY_ID = '3637529f-c495-4089-8744-9fee54bf1f05';
const MUSK_IDENTITY_ID = 'cbc01c0f-6766-4063-9171-bf27b1746ee0';

// Helper function to create category
async function createCategory(identityId, name, type, level = 1, parentId = null) {
  const { data, error } = await supabase
    .from('categories')
    .insert({
      identity_id: identityId,
      parent_id: parentId,
      name,
      type,
      level
    })
    .select()
    .single();

  if (error) {
    console.error(`Error creating category ${name}:`, error.message);
    return null;
  }
  console.log(`✓ Created category: ${name}`);
  return data;
}

// Helper function to create influences
async function createInfluences(categoryId, influences) {
  for (let i = 0; i < influences.length; i++) {
    const influence = influences[i];
    const { error } = await supabase
      .from('influences')
      .insert({
        category_id: categoryId,
        name: influence.name,
        alignment: influence.alignment,
        position: i,
        mood_tags: influence.mood_tags || [],
        metadata: influence.metadata || {}
      });

    if (error) {
      console.error(`Error creating influence ${influence.name}:`, error.message);
    } else {
      console.log(`  ✓ Added: ${influence.name} (${influence.alignment}%)`);
    }
  }
}

// ========================================
// BARACK OBAMA PROFILE
// ========================================

async function populateObamaProfile() {
  console.log('\n🔵 POPULATING BARACK OBAMA PROFILE\n');

  // MUSIC - Main category
  const musicCat = await createCategory(OBAMA_IDENTITY_ID, 'Music', 'music', 1);
  if (!musicCat) return;

  // Jazz subcategory
  const jazzCat = await createCategory(OBAMA_IDENTITY_ID, 'Jazz', 'music', 2, musicCat.id);
  await createInfluences(jazzCat.id, [
    { name: 'Miles Davis', alignment: 95, mood_tags: ['cool', 'sophisticated', 'legendary'] },
    { name: 'John Coltrane', alignment: 92, mood_tags: ['spiritual', 'intense', 'innovative'] },
    { name: 'Thelonious Monk', alignment: 88, mood_tags: ['quirky', 'cerebral', 'genius'] },
    { name: 'Charlie Parker', alignment: 85, mood_tags: ['bebop', 'virtuoso'] },
    { name: 'Duke Ellington', alignment: 90, mood_tags: ['classic', 'elegant', 'big-band'] },
    { name: 'Billie Holiday', alignment: 87, mood_tags: ['emotional', 'timeless'] },
    { name: 'Ella Fitzgerald', alignment: 85, mood_tags: ['pure', 'vocal-genius'] }
  ]);

  // Soul & R&B subcategory
  const soulCat = await createCategory(OBAMA_IDENTITY_ID, 'Soul & R&B', 'music', 2, musicCat.id);
  await createInfluences(soulCat.id, [
    { name: 'Stevie Wonder', alignment: 95, mood_tags: ['genius', 'uplifting', 'classic'] },
    { name: 'Aretha Franklin', alignment: 93, mood_tags: ['powerful', 'soulful', 'queen'] },
    { name: 'Marvin Gaye', alignment: 92, mood_tags: ['smooth', 'political', 'romantic'] },
    { name: 'Al Green', alignment: 88, mood_tags: ['smooth', 'romantic'] },
    { name: 'Otis Redding', alignment: 87, mood_tags: ['raw', 'emotional'] },
    { name: 'Curtis Mayfield', alignment: 85, mood_tags: ['socially-conscious', 'funky'] },
    { name: 'Etta James', alignment: 84, mood_tags: ['powerful', 'bluesy'] }
  ]);

  // Hip-Hop subcategory
  const hiphopCat = await createCategory(OBAMA_IDENTITY_ID, 'Hip-Hop', 'music', 2, musicCat.id);
  await createInfluences(hiphopCat.id, [
    { name: 'Jay-Z', alignment: 90, mood_tags: ['intelligent', 'storytelling', 'business-minded'] },
    { name: 'Kendrick Lamar', alignment: 92, mood_tags: ['conscious', 'poetic', 'powerful'] },
    { name: 'Nas', alignment: 87, mood_tags: ['lyrical', 'storytelling'] },
    { name: 'Common', alignment: 85, mood_tags: ['conscious', 'Chicago'] },
    { name: 'Kanye West (early work)', alignment: 78, mood_tags: ['innovative', 'production'] },
    { name: 'OutKast', alignment: 84, mood_tags: ['creative', 'southern'] },
    { name: 'The Roots', alignment: 86, mood_tags: ['live-instrumentation', 'Philadelphia'] }
  ]);

  // Classic Rock & Pop subcategory
  const rockCat = await createCategory(OBAMA_IDENTITY_ID, 'Classic Rock & Pop', 'music', 2, musicCat.id);
  await createInfluences(rockCat.id, [
    { name: 'The Beatles', alignment: 88, mood_tags: ['timeless', 'innovative'] },
    { name: 'The Rolling Stones', alignment: 85, mood_tags: ['rock', 'classic'] },
    { name: 'Bob Dylan', alignment: 90, mood_tags: ['poetic', 'protest', 'influential'] },
    { name: 'Bruce Springsteen', alignment: 87, mood_tags: ['working-class', 'American'] },
    { name: 'U2', alignment: 82, mood_tags: ['anthemic', 'political'] }
  ]);

  // FOOD - Main category
  const foodCat = await createCategory(OBAMA_IDENTITY_ID, 'Food & Dining', 'food', 1);
  
  // Favorites subcategory
  const favoritesCat = await createCategory(OBAMA_IDENTITY_ID, 'Favorite Foods', 'food', 2, foodCat.id);
  await createInfluences(favoritesCat.id, [
    { name: 'Chili', alignment: 92, mood_tags: ['comfort', 'hearty'] },
    { name: 'Broccoli', alignment: 85, mood_tags: ['healthy', 'vegetable'] },
    { name: 'Trail Mix', alignment: 80, mood_tags: ['snack', 'healthy'] },
    { name: 'Green Tea', alignment: 88, mood_tags: ['beverage', 'healthy'] },
    { name: 'Hawaiian Food', alignment: 90, mood_tags: ['nostalgic', 'cultural-roots'] },
    { name: 'Poke', alignment: 87, mood_tags: ['Hawaiian', 'fresh'] },
    { name: 'Spam Musubi', alignment: 75, mood_tags: ['Hawaiian', 'comfort'] },
    { name: 'Shave Ice', alignment: 82, mood_tags: ['Hawaiian', 'dessert'] }
  ]);

  // Cuisine preferences
  const cuisineCat = await createCategory(OBAMA_IDENTITY_ID, 'Cuisine Preferences', 'food', 2, foodCat.id);
  await createInfluences(cuisineCat.id, [
    { name: 'Hawaiian', alignment: 92, mood_tags: ['nostalgic', 'comfort'] },
    { name: 'American Comfort Food', alignment: 85, mood_tags: ['traditional'] },
    { name: 'Mediterranean', alignment: 80, mood_tags: ['healthy'] },
    { name: 'BBQ', alignment: 78, mood_tags: ['American', 'smoky'] }
  ]);

  // Avoid
  const avoidCat = await createCategory(OBAMA_IDENTITY_ID, 'Avoid', 'food', 2, foodCat.id);
  await createInfluences(avoidCat.id, [
    { name: 'Beets', alignment: 15, mood_tags: ['dislike'] }
  ]);

  // VALUES - Main category
  const valuesCat = await createCategory(OBAMA_IDENTITY_ID, 'Values & Principles', 'values', 1);
  await createInfluences(valuesCat.id, [
    { name: 'Democracy', alignment: 98, mood_tags: ['core-belief', 'political'] },
    { name: 'Public Service', alignment: 95, mood_tags: ['career', 'dedication'] },
    { name: 'Education', alignment: 93, mood_tags: ['opportunity', 'equality'] },
    { name: 'Equality', alignment: 96, mood_tags: ['justice', 'civil-rights'] },
    { name: 'Diplomacy', alignment: 92, mood_tags: ['international', 'peace'] },
    { name: 'Community Organizing', alignment: 90, mood_tags: ['grassroots', 'empowerment'] },
    { name: 'Hope and Change', alignment: 94, mood_tags: ['optimism', 'progress'] },
    { name: 'Pragmatic Idealism', alignment: 91, mood_tags: ['balanced', 'thoughtful'] }
  ]);

  // INTELLECTUAL - Main category
  const intellectualCat = await createCategory(OBAMA_IDENTITY_ID, 'Intellectual Influences', 'intellectual', 1);
  
  // Historical Figures
  const historicalCat = await createCategory(OBAMA_IDENTITY_ID, 'Historical Figures', 'intellectual', 2, intellectualCat.id);
  await createInfluences(historicalCat.id, [
    { name: 'Martin Luther King Jr.', alignment: 98, mood_tags: ['civil-rights', 'moral-authority'] },
    { name: 'Abraham Lincoln', alignment: 95, mood_tags: ['president', 'unifier'] },
    { name: 'Mahatma Gandhi', alignment: 92, mood_tags: ['nonviolence', 'justice'] },
    { name: 'Nelson Mandela', alignment: 94, mood_tags: ['reconciliation', 'leadership'] }
  ]);

  // Writers & Thinkers
  const writersCat = await createCategory(OBAMA_IDENTITY_ID, 'Writers & Thinkers', 'intellectual', 2, intellectualCat.id);
  await createInfluences(writersCat.id, [
    { name: 'Reinhold Niebuhr', alignment: 88, mood_tags: ['theology', 'political-realism'] },
    { name: 'Toni Morrison', alignment: 90, mood_tags: ['literature', 'African-American'] },
    { name: 'James Baldwin', alignment: 87, mood_tags: ['civil-rights', 'essays'] },
    { name: 'Ta-Nehisi Coates', alignment: 85, mood_tags: ['contemporary', 'race'] },
    { name: 'Doris Kearns Goodwin', alignment: 82, mood_tags: ['history', 'biography'] }
  ]);

  // ENTERTAINMENT - Main category
  const entertainmentCat = await createCategory(OBAMA_IDENTITY_ID, 'Entertainment', 'entertainment', 1);
  
  // TV Shows
  const tvCat = await createCategory(OBAMA_IDENTITY_ID, 'TV Shows', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(tvCat.id, [
    { name: 'The Wire', alignment: 95, mood_tags: ['favorite', 'urban', 'realistic'] },
    { name: 'Game of Thrones', alignment: 85, mood_tags: ['epic', 'fantasy'] },
    { name: 'Breaking Bad', alignment: 82, mood_tags: ['drama', 'intense'] },
    { name: 'The West Wing', alignment: 88, mood_tags: ['political', 'idealistic'] }
  ]);

  // Movies
  const moviesCat = await createCategory(OBAMA_IDENTITY_ID, 'Movies', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(moviesCat.id, [
    { name: 'The Godfather', alignment: 92, mood_tags: ['classic', 'crime'] },
    { name: 'Casablanca', alignment: 85, mood_tags: ['romance', 'classic'] },
    { name: 'Lawrence of Arabia', alignment: 83, mood_tags: ['epic', 'historical'] }
  ]);

  // Sports
  const sportsCat = await createCategory(OBAMA_IDENTITY_ID, 'Sports', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(sportsCat.id, [
    { name: 'Basketball', alignment: 95, mood_tags: ['player', 'passion'] },
    { name: 'Chicago Bulls', alignment: 90, mood_tags: ['team', 'hometown'] },
    { name: 'LA Lakers', alignment: 75, mood_tags: ['team', 'West-Coast'] },
    { name: 'Michael Jordan', alignment: 93, mood_tags: ['legend', 'GOAT'] },
    { name: 'LeBron James', alignment: 85, mood_tags: ['contemporary', 'activist'] }
  ]);

  // COMMUNICATION STYLE - Main category
  const commCat = await createCategory(OBAMA_IDENTITY_ID, 'Communication Style', 'communication', 1);
  await createInfluences(commCat.id, [
    { name: 'Oratory', alignment: 95, mood_tags: ['speeches', 'eloquent'] },
    { name: 'Storytelling', alignment: 92, mood_tags: ['personal', 'relatable'] },
    { name: 'Measured & Deliberate', alignment: 90, mood_tags: ['thoughtful', 'careful'] },
    { name: 'Humor with Timing', alignment: 88, mood_tags: ['witty', 'self-deprecating'] },
    { name: 'Inspirational', alignment: 93, mood_tags: ['hope', 'motivation'] },
    { name: 'Professorial', alignment: 85, mood_tags: ['teaching', 'explanatory'] },
    { name: 'Cool Under Pressure', alignment: 91, mood_tags: ['calm', 'composed'] }
  ]);

  console.log('\n✅ Barack Obama profile populated!\n');
}

// ========================================
// ELON MUSK PROFILE
// ========================================

async function populateMuskProfile() {
  console.log('\n🚀 POPULATING ELON MUSK PROFILE\n');

  // MUSIC - Main category
  const musicCat = await createCategory(MUSK_IDENTITY_ID, 'Music', 'music', 1);
  
  // EDM & Electronic
  const edmCat = await createCategory(MUSK_IDENTITY_ID, 'EDM & Electronic', 'music', 2, musicCat.id);
  await createInfluences(edmCat.id, [
    { name: 'Daft Punk', alignment: 85, mood_tags: ['electronic', 'French'] },
    { name: 'Grimes', alignment: 90, mood_tags: ['electronic', 'avant-garde', 'personal'] },
    { name: 'Deadmau5', alignment: 78, mood_tags: ['EDM', 'techno'] },
    { name: 'Kraftwerk', alignment: 82, mood_tags: ['electronic', 'pioneers'] }
  ]);

  // Hip-Hop
  const hiphopCat = await createCategory(MUSK_IDENTITY_ID, 'Hip-Hop', 'music', 2, musicCat.id);
  await createInfluences(hiphopCat.id, [
    { name: 'Kanye West', alignment: 85, mood_tags: ['innovative', 'controversial'] },
    { name: 'Eminem', alignment: 78, mood_tags: ['lyrical', 'technical'] }
  ]);

  // FOOD - Main category
  const foodCat = await createCategory(MUSK_IDENTITY_ID, 'Food & Dining', 'food', 1);
  await createInfluences(foodCat.id, [
    { name: 'BBQ', alignment: 82, mood_tags: ['American', 'casual'] },
    { name: 'French Cuisine', alignment: 75, mood_tags: ['refined'] },
    { name: 'Whiskey', alignment: 80, mood_tags: ['beverage', 'spirits'] },
    { name: 'Diet Coke', alignment: 88, mood_tags: ['beverage', 'caffeine', 'daily'] },
    { name: 'Mars Bars', alignment: 72, mood_tags: ['candy', 'nostalgia', 'Mars-pun'] },
    { name: 'Fast Work Lunches', alignment: 70, mood_tags: ['efficiency', 'minimal-time'] }
  ]);

  // VALUES - Main category
  const valuesCat = await createCategory(MUSK_IDENTITY_ID, 'Values & Principles', 'values', 1);
  await createInfluences(valuesCat.id, [
    { name: 'Multi-Planetary Species', alignment: 98, mood_tags: ['core-mission', 'Mars'] },
    { name: 'Free Speech Absolutism', alignment: 95, mood_tags: ['political', 'Twitter'] },
    { name: 'Engineering First Principles', alignment: 97, mood_tags: ['methodology', 'problem-solving'] },
    { name: 'Sustainable Energy', alignment: 92, mood_tags: ['Tesla', 'environment'] },
    { name: 'AI Safety (with caveats)', alignment: 85, mood_tags: ['existential-risk', 'technology'] },
    { name: 'Accelerationism', alignment: 90, mood_tags: ['progress', 'speed'] },
    { name: 'Manufacturing Excellence', alignment: 93, mood_tags: ['production', 'scaling'] },
    { name: 'Work Ethic', alignment: 95, mood_tags: ['intense', 'dedication'] }
  ]);

  // INTELLECTUAL - Main category
  const intellectualCat = await createCategory(MUSK_IDENTITY_ID, 'Intellectual Influences', 'intellectual', 1);
  
  // Science Fiction
  const scifiCat = await createCategory(MUSK_IDENTITY_ID, 'Science Fiction', 'intellectual', 2, intellectualCat.id);
  await createInfluences(scifiCat.id, [
    { name: 'Douglas Adams (Hitchhiker\'s Guide)', alignment: 95, mood_tags: ['humor', 'philosophy', 'favorite'] },
    { name: 'Isaac Asimov (Foundation)', alignment: 93, mood_tags: ['civilization', 'planning'] },
    { name: 'Iain Banks (Culture Series)', alignment: 90, mood_tags: ['utopian', 'AI'] },
    { name: 'Robert Heinlein', alignment: 85, mood_tags: ['libertarian', 'space'] },
    { name: 'Neal Stephenson', alignment: 82, mood_tags: ['cyberpunk', 'technical'] }
  ]);

  // Thinkers & Scientists
  const thinkersCat = await createCategory(MUSK_IDENTITY_ID, 'Thinkers & Scientists', 'intellectual', 2, intellectualCat.id);
  await createInfluences(thinkersCat.id, [
    { name: 'Nick Bostrom', alignment: 87, mood_tags: ['AI-safety', 'existential-risk'] },
    { name: 'Richard Feynman', alignment: 90, mood_tags: ['physics', 'first-principles'] },
    { name: 'Nikola Tesla', alignment: 88, mood_tags: ['engineering', 'innovation'] },
    { name: 'Werner von Braun', alignment: 82, mood_tags: ['rockets', 'space'] }
  ]);

  // ENTERTAINMENT - Main category
  const entertainmentCat = await createCategory(MUSK_IDENTITY_ID, 'Entertainment', 'entertainment', 1);
  
  // Anime
  const animeCat = await createCategory(MUSK_IDENTITY_ID, 'Anime', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(animeCat.id, [
    { name: 'Neon Genesis Evangelion', alignment: 92, mood_tags: ['psychological', 'mecha'] },
    { name: 'Full Metal Alchemist', alignment: 85, mood_tags: ['adventure', 'philosophy'] },
    { name: 'Death Note', alignment: 83, mood_tags: ['psychological', 'thriller'] },
    { name: 'Your Name', alignment: 78, mood_tags: ['romantic', 'artistic'] }
  ]);

  // Gaming
  const gamingCat = await createCategory(MUSK_IDENTITY_ID, 'Gaming', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(gamingCat.id, [
    { name: 'Elden Ring', alignment: 90, mood_tags: ['challenging', 'immersive'] },
    { name: 'Diablo', alignment: 87, mood_tags: ['action-RPG', 'classic'] },
    { name: 'Polytopia', alignment: 85, mood_tags: ['strategy', 'mobile'] },
    { name: 'Overwatch', alignment: 80, mood_tags: ['competitive', 'team'] },
    { name: 'Cyberpunk 2077', alignment: 82, mood_tags: ['sci-fi', 'RPG'] }
  ]);

  // Movies & Shows
  const moviesCat = await createCategory(MUSK_IDENTITY_ID, 'Movies & Shows', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(moviesCat.id, [
    { name: 'Interstellar', alignment: 88, mood_tags: ['space', 'emotional'] },
    { name: 'The Martian', alignment: 85, mood_tags: ['Mars', 'engineering'] },
    { name: 'Iron Man', alignment: 83, mood_tags: ['tech', 'inspiration'] },
    { name: '2001: A Space Odyssey', alignment: 87, mood_tags: ['classic', 'AI'] }
  ]);

  // Memes & Internet Culture
  const memesCat = await createCategory(MUSK_IDENTITY_ID, 'Memes & Internet Culture', 'entertainment', 2, entertainmentCat.id);
  await createInfluences(memesCat.id, [
    { name: 'Doge', alignment: 92, mood_tags: ['crypto', 'humor'] },
    { name: 'Anime Memes', alignment: 85, mood_tags: ['weeb', 'culture'] },
    { name: 'Dark Humor', alignment: 88, mood_tags: ['edgy', 'controversial'] },
    { name: 'Shitposting', alignment: 90, mood_tags: ['Twitter', 'trolling'] }
  ]);

  // COMMUNICATION STYLE - Main category
  const commCat = await createCategory(MUSK_IDENTITY_ID, 'Communication Style', 'communication', 1);
  await createInfluences(commCat.id, [
    { name: 'Memes', alignment: 95, mood_tags: ['Twitter', 'humor'] },
    { name: 'Shitposting', alignment: 92, mood_tags: ['provocative', 'fun'] },
    { name: 'Direct & Blunt', alignment: 90, mood_tags: ['no-filter', 'honest'] },
    { name: 'Twitter-Native', alignment: 93, mood_tags: ['platform', 'realtime'] },
    { name: 'Technical Deep Dives', alignment: 85, mood_tags: ['engineering', 'detailed'] },
    { name: 'Provocative', alignment: 88, mood_tags: ['controversial', 'attention'] },
    { name: 'Self-Deprecating Humor', alignment: 80, mood_tags: ['memes', 'relatable'] }
  ]);

  console.log('\n✅ Elon Musk profile populated!\n');
}

// ========================================
// RUN BOTH
// ========================================

async function main() {
  console.log('🎯 POPULATING SHOWCASE IDENTITY PROFILES');
  console.log('==========================================\n');
  
  await populateObamaProfile();
  await populateMuskProfile();
  
  console.log('\n✅ ALL DONE! Both showcase profiles populated.\n');
}

main().catch(console.error);
