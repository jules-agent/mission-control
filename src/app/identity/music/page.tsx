import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import MusicCuratorView from '../components/MusicCuratorView';

export default async function MusicCuratorPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/identity/login');
  
  // Get user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
  
  if (!profile) redirect('/identity');
  
  // Get Music domain and all subcategories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('archived', false)
    .or('name.eq.Music,parent_id.not.is.null')
    .order('parent_id.nullsfirst,name');
  
  // Filter to only Music domain tree
  const musicDomain = categories?.find(c => c.name === 'Music' && !c.parent_id);
  const musicCategories = categories?.filter(c => 
    c.id === musicDomain?.id || c.parent_id === musicDomain?.id
  ) || [];
  
  // Get all influences for music categories
  const categoryIds = musicCategories.map(c => c.id);
  const { data: influences } = await supabase
    .from('influences')
    .select('*')
    .in('category_id', categoryIds)
    .order('alignment', { ascending: false });
  
  // Group influences by category
  const influencesByCategory: Record<string, any[]> = {};
  influences?.forEach(inf => {
    if (!influencesByCategory[inf.category_id]) {
      influencesByCategory[inf.category_id] = [];
    }
    influencesByCategory[inf.category_id].push(inf);
  });
  
  return (
    <MusicCuratorView
      profile={profile}
      categories={musicCategories}
      influences={influencesByCategory}
    />
  );
}
