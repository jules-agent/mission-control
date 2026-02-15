import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import NewsCuratorView from '../components/NewsCuratorView';

export default async function NewsCuratorPage() {
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
  
  // Get Work & Business domain (where news lives)
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('profile_id', profile.id)
    .eq('archived', false)
    .order('parent_id.nullsfirst,name');
  
  const workDomain = categories?.find(c => c.name === 'Work & Business' && !c.parent_id);
  const workCategories = categories?.filter(c => 
    c.id === workDomain?.id || c.parent_id === workDomain?.id
  ) || [];
  
  const newsCategory = workCategories.find(c => c.name === 'News Sources');
  
  // Get all influences for news
  const categoryIds = workCategories.map(c => c.id);
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
    <NewsCuratorView
      profile={profile}
      categories={workCategories}
      influences={influencesByCategory}
      newsCategory={newsCategory}
    />
  );
}
