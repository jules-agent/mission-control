import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';

interface SharePageProps {
  params: { slug: string };
}

export default async function SharePage({ params }: SharePageProps) {
  const supabase = await createClient();
  
  // Fetch share link
  const { data: shareLink, error: linkError } = await supabase
    .from('share_links')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_active', true)
    .single();
  
  if (linkError || !shareLink) {
    return notFound();
  }
  
  // Check expiration
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="text-6xl">⏰</div>
          <h1 className="text-2xl font-bold">Link Expired</h1>
          <p className="text-gray-600 dark:text-gray-400">
            This share link has expired and is no longer available.
          </p>
        </div>
      </div>
    );
  }
  
  // Increment view count
  await supabase
    .from('share_links')
    .update({ 
      view_count: (shareLink.view_count || 0) + 1,
      last_viewed_at: new Date().toISOString()
    })
    .eq('id', shareLink.id);
  
  // Fetch shared categories
  const { data: sharedCategories } = await supabase
    .from('share_link_categories')
    .select('category_id, include_subcategories')
    .eq('share_link_id', shareLink.id);
  
  if (!sharedCategories || sharedCategories.length === 0) {
    return notFound();
  }
  
  const categoryIds = sharedCategories.map(sc => sc.category_id);
  
  // Fetch category details and influences
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, type, parent_id')
    .in('id', categoryIds);
  
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
  
  // Fetch gift tracking
  const { data: giftTracking } = await supabase
    .from('gift_tracking')
    .select('*')
    .eq('share_link_id', shareLink.id);
  
  const purchasedInfluenceIds = new Set(
    giftTracking?.map(g => g.influence_id).filter(Boolean) || []
  );
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h1 className="text-3xl font-bold mb-2">{shareLink.title}</h1>
          {shareLink.description && (
            <p className="text-gray-600 dark:text-gray-400">{shareLink.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500">
            <span>👁️ {shareLink.view_count || 0} views</span>
            {shareLink.expires_at && (
              <span>⏰ Expires {new Date(shareLink.expires_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
        
        {/* Categories */}
        {categories?.map(category => {
          const catInfluences = influencesByCategory[category.id] || [];
          
          return (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">{category.name}</h2>
              
              {catInfluences.length === 0 ? (
                <p className="text-gray-500">No items in this category</p>
              ) : (
                <div className="space-y-3">
                  {catInfluences.map(influence => {
                    const isPurchased = purchasedInfluenceIds.has(influence.id);
                    
                    return (
                      <div
                        key={influence.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isPurchased
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{influence.name}</h3>
                            {isPurchased && (
                              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                                Purchased ✓
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${influence.alignment}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                              {influence.alignment}%
                            </span>
                          </div>
                        </div>
                        
                        {!isPurchased && (
                          <button
                            onClick={async () => {
                              const purchaserName = prompt('Your name:');
                              const purchaserEmail = prompt('Your email (optional):');
                              
                              if (!purchaserName) return;
                              
                              const response = await fetch('/api/identity/share/mark-purchased', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  shareLinkId: shareLink.id,
                                  influenceId: influence.id,
                                  purchaserName,
                                  purchaserEmail,
                                }),
                              });
                              
                              if (response.ok) {
                                window.location.reload();
                              } else {
                                alert('Failed to mark as purchased');
                              }
                            }}
                            className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm whitespace-nowrap"
                          >
                            I Bought This
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4">
          <p>Powered by Master Identity System</p>
        </div>
      </div>
    </div>
  );
}
