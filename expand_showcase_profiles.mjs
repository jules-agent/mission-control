import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const OBAMA_IDENTITY_ID = '3637529f-c495-4089-8744-9fee54bf1f05';
const MUSK_IDENTITY_ID = 'cbc01c0f-6766-4063-9171-bf27b1746ee0';

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
// EXPAND BARACK OBAMA PROFILE
// ========================================

async function expandObamaProfile() {
  console.log('\n🔵 EXPANDING BARACK OBAMA PROFILE\n');

  // BOOKS - Main category
  const booksCat = await createCategory(OBAMA_IDENTITY_ID, 'Books & Reading', 'books', 1);
  
  // Fiction
  const fictionCat = await createCategory(OBAMA_IDENTITY_ID, 'Fiction', 'books', 2, booksCat.id);
  await createInfluences(fictionCat.id, [
    { name: 'Song of Solomon (Toni Morrison)', alignment: 90, mood_tags: ['literary', 'African-American'] },
    { name: 'Moby Dick (Herman Melville)', alignment: 85, mood_tags: ['classic', 'American'] },
    { name: 'The Fire Next Time (James Baldwin)', alignment: 88, mood_tags: ['essays', 'civil-rights'] },
    { name: '1984 (George Orwell)', alignment: 82, mood_tags: ['dystopian', 'political'] },
    { name: 'Invisible Man (Ralph Ellison)', alignment: 87, mood_tags: ['American', 'identity'] }
  ]);

  // Non-Fiction
  const nonfictionCat = await createCategory(OBAMA_IDENTITY_ID, 'Non-Fiction', 'books', 2, booksCat.id);
  await createInfluences(nonfictionCat.id, [
    { name: 'Team of Rivals (Doris Kearns Goodwin)', alignment: 92, mood_tags: ['history', 'Lincoln'] },
    { name: 'The Audacity of Hope (own work)', alignment: 90, mood_tags: ['politics', 'memoir'] },
    { name: 'Dreams from My Father (own work)', alignment: 88, mood_tags: ['memoir', 'identity'] },
    { name: 'A Promised Land (own work)', alignment: 89, mood_tags: ['memoir', 'presidency'] },
    { name: 'The Souls of Black Folk (W.E.B. Du Bois)', alignment: 86, mood_tags: ['history', 'race'] }
  ]);

  // HOBBIES & INTERESTS - Main category
  const hobbiesCat = await createCategory(OBAMA_IDENTITY_ID, 'Hobbies & Interests', 'hobbies', 1);
  await createInfluences(hobbiesCat.id, [
    { name: 'Playing Basketball', alignment: 95, mood_tags: ['active', 'regular'] },
    { name: 'Reading', alignment: 92, mood_tags: ['intellectual', 'daily'] },
    { name: 'Golf', alignment: 75, mood_tags: ['relaxation', 'criticized'] },
    { name: 'Poker', alignment: 72, mood_tags: ['strategy', 'social'] },
    { name: 'Spending Time with Family', alignment: 93, mood_tags: ['priority', 'balance'] },
    { name: 'Music Discovery', alignment: 85, mood_tags: ['playlists', 'curation'] }
  ]);

  // LIFESTYLE - Main category
  const lifestyleCat = await createCategory(OBAMA_IDENTITY_ID, 'Lifestyle & Daily Habits', 'lifestyle', 1);
  await createInfluences(lifestyleCat.id, [
    { name: 'Early Riser', alignment: 85, mood_tags: ['morning-person', 'discipline'] },
    { name: 'Fitness Routine', alignment: 88, mood_tags: ['healthy', 'regular'] },
    { name: 'Limited Wardrobe (suits)', alignment: 90, mood_tags: ['decision-fatigue', 'efficiency'] },
    { name: 'Family Dinners', alignment: 92, mood_tags: ['priority', 'tradition'] },
    { name: 'Thoughtful Decision-Making', alignment: 93, mood_tags: ['deliberate', 'careful'] },
    { name: 'Cool Under Pressure', alignment: 91, mood_tags: ['temperament', 'leadership'] }
  ]);

  // PERSONAL HEROES - Main category
  const heroesCat = await createCategory(OBAMA_IDENTITY_ID, 'Personal Heroes', 'heroes', 1);
  await createInfluences(heroesCat.id, [
    { name: 'Muhammad Ali', alignment: 88, mood_tags: ['courage', 'conviction'] },
    { name: 'Jackie Robinson', alignment: 87, mood_tags: ['barrier-breaker', 'dignity'] },
    { name: 'Rosa Parks', alignment: 90, mood_tags: ['courage', 'civil-rights'] },
    { name: 'Cesar Chavez', alignment: 85, mood_tags: ['organizing', 'justice'] },
    { name: 'John Lewis', alignment: 92, mood_tags: ['good-trouble', 'inspiration'] }
  ]);

  // SPEECHES & MOMENTS - Main category
  const speechesCat = await createCategory(OBAMA_IDENTITY_ID, 'Memorable Speeches', 'speeches', 1);
  await createInfluences(speechesCat.id, [
    { name: '2004 DNC Keynote', alignment: 95, mood_tags: ['breakthrough', 'hope'] },
    { name: 'Yes We Can (2008)', alignment: 93, mood_tags: ['victory', 'historic'] },
    { name: 'Selma 50th Anniversary', alignment: 90, mood_tags: ['civil-rights', 'history'] },
    { name: 'Charleston AME Church Eulogy', alignment: 92, mood_tags: ['healing', 'Amazing-Grace'] },
    { name: 'Farewell Address', alignment: 88, mood_tags: ['gratitude', 'warning'] }
  ]);

  console.log('\n✅ Barack Obama profile expanded!\n');
}

// ========================================
// EXPAND ELON MUSK PROFILE
// ========================================

async function expandMuskProfile() {
  console.log('\n🚀 EXPANDING ELON MUSK PROFILE\n');

  // BOOKS - Main category
  const booksCat = await createCategory(MUSK_IDENTITY_ID, 'Books & Reading', 'books', 1);
  await createInfluences(booksCat.id, [
    { name: 'The Lord of the Rings (Tolkien)', alignment: 88, mood_tags: ['fantasy', 'epic'] },
    { name: 'Foundation Series (Asimov)', alignment: 95, mood_tags: ['sci-fi', 'civilization'] },
    { name: 'Structures: Or Why Things Don\'t Fall Down', alignment: 85, mood_tags: ['engineering', 'technical'] },
    { name: 'Benjamin Franklin: An American Life', alignment: 82, mood_tags: ['biography', 'inventor'] },
    { name: 'Zero to One (Peter Thiel)', alignment: 80, mood_tags: ['startups', 'innovation'] },
    { name: 'The Moon is a Harsh Mistress (Heinlein)', alignment: 87, mood_tags: ['libertarian', 'space'] },
    { name: 'Superintelligence (Nick Bostrom)', alignment: 88, mood_tags: ['AI', 'existential-risk'] }
  ]);

  // COMPANIES & VENTURES - Main category
  const companiesCat = await createCategory(MUSK_IDENTITY_ID, 'Companies & Projects', 'companies', 1);
  await createInfluences(companiesCat.id, [
    { name: 'SpaceX', alignment: 98, mood_tags: ['Mars', 'rockets', 'core-mission'] },
    { name: 'Tesla', alignment: 96, mood_tags: ['EVs', 'sustainable-energy'] },
    { name: 'Neuralink', alignment: 90, mood_tags: ['brain-computer', 'future'] },
    { name: 'The Boring Company', alignment: 75, mood_tags: ['tunnels', 'infrastructure'] },
    { name: 'X (formerly Twitter)', alignment: 92, mood_tags: ['free-speech', 'platform'] },
    { name: 'Starlink', alignment: 88, mood_tags: ['internet', 'connectivity'] },
    { name: 'OpenAI (past)', alignment: 70, mood_tags: ['complicated', 'diverged'] }
  ]);

  // HOBBIES & INTERESTS - Main category
  const hobbiesCat = await createCategory(MUSK_IDENTITY_ID, 'Hobbies & Interests', 'hobbies', 1);
  await createInfluences(hobbiesCat.id, [
    { name: 'Gaming (Hardcore)', alignment: 90, mood_tags: ['stress-relief', 'competitive'] },
    { name: 'Anime Watching', alignment: 85, mood_tags: ['culture', 'storytelling'] },
    { name: 'Meme Creation', alignment: 92, mood_tags: ['humor', 'Twitter'] },
    { name: 'Engineering Deep Dives', alignment: 95, mood_tags: ['passion', 'technical'] },
    { name: 'Rocket Design', alignment: 97, mood_tags: ['hands-on', 'obsession'] },
    { name: 'AI Research', alignment: 88, mood_tags: ['existential', 'AGI'] }
  ]);

  // LIFESTYLE - Main category
  const lifestyleCat = await createCategory(MUSK_IDENTITY_ID, 'Lifestyle & Work Habits', 'lifestyle', 1);
  await createInfluences(lifestyleCat.id, [
    { name: '80-120 Hour Work Weeks', alignment: 95, mood_tags: ['intense', 'dedication'] },
    { name: 'Sleeping on Factory Floor', alignment: 88, mood_tags: ['committed', 'hands-on'] },
    { name: 'Time Blocking (5-min increments)', alignment: 90, mood_tags: ['efficiency', 'productivity'] },
    { name: 'Minimal Personal Possessions', alignment: 78, mood_tags: ['focus', 'mission'] },
    { name: 'Late Night Twitter', alignment: 92, mood_tags: ['shitposting', 'unfiltered'] },
    { name: 'Diet Coke Addiction', alignment: 85, mood_tags: ['caffeine', 'fuel'] }
  ]);

  // HEROES & INFLUENCES - Main category
  const heroesCat = await createCategory(MUSK_IDENTITY_ID, 'Heroes & Role Models', 'heroes', 1);
  await createInfluences(heroesCat.id, [
    { name: 'Nikola Tesla', alignment: 92, mood_tags: ['inventor', 'namesake'] },
    { name: 'Thomas Edison', alignment: 85, mood_tags: ['inventor', 'entrepreneur'] },
    { name: 'Werner von Braun', alignment: 88, mood_tags: ['rockets', 'visionary'] },
    { name: 'Henry Ford', alignment: 80, mood_tags: ['manufacturing', 'scaling'] },
    { name: 'Gene Roddenberry (Star Trek)', alignment: 83, mood_tags: ['optimistic-future', 'sci-fi'] }
  ]);

  // TECHNOLOGY INTERESTS - Main category
  const techCat = await createCategory(MUSK_IDENTITY_ID, 'Technology Interests', 'technology', 1);
  await createInfluences(techCat.id, [
    { name: 'Rocket Propulsion', alignment: 98, mood_tags: ['expertise', 'passion'] },
    { name: 'Battery Technology', alignment: 94, mood_tags: ['Tesla', 'energy'] },
    { name: 'AI & Machine Learning', alignment: 92, mood_tags: ['future', 'risk'] },
    { name: 'Solar Energy', alignment: 88, mood_tags: ['sustainable', 'future'] },
    { name: 'Neural Interfaces', alignment: 90, mood_tags: ['brain-computer', 'future'] },
    { name: 'Manufacturing Automation', alignment: 93, mood_tags: ['scaling', 'efficiency'] },
    { name: 'Tunneling Technology', alignment: 75, mood_tags: ['infrastructure', 'Boring-Company'] }
  ]);

  // CONTROVERSIAL MOMENTS - Main category
  const controversyCat = await createCategory(MUSK_IDENTITY_ID, 'Controversial Moments', 'controversy', 1);
  await createInfluences(controversyCat.id, [
    { name: '"Pedo Guy" Tweet', alignment: 25, mood_tags: ['regret', 'impulsive'] },
    { name: 'SEC "Funding Secured" Battle', alignment: 40, mood_tags: ['legal', 'consequences'] },
    { name: 'Joe Rogan Weed Incident', alignment: 60, mood_tags: ['publicity', 'stock-drop'] },
    { name: 'Twitter Takeover Drama', alignment: 70, mood_tags: ['bold', 'chaotic'] },
    { name: 'Dogecoin Pumping on SNL', alignment: 75, mood_tags: ['memes', 'crypto'] }
  ]);

  console.log('\n✅ Elon Musk profile expanded!\n');
}

// ========================================
// RUN BOTH
// ========================================

async function main() {
  console.log('🎯 EXPANDING SHOWCASE IDENTITY PROFILES');
  console.log('=========================================\n');
  
  await expandObamaProfile();
  await expandMuskProfile();
  
  console.log('\n✅ ALL DONE! Both showcase profiles expanded with rich detail.\n');
}

main().catch(console.error);
