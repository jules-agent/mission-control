import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const ADMIN_EMAIL = 'ben@unpluggedperformance.com';
const SUPABASE_URL = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

async function checkAdminAuth(request: Request): Promise<{ isAdmin: boolean; error?: NextResponse }> {
  const authHeader = request.headers.get('cookie');
  if (!authHeader) {
    return { isAdmin: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const cookies = authHeader.split(';').map(c => c.trim());
  const accessTokenCookie = cookies.find(c => c.startsWith('sb-nqikobnkhpyfduqgfrew-auth-token'));
  
  if (!accessTokenCookie) {
    return { isAdmin: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const tokenData = JSON.parse(decodeURIComponent(accessTokenCookie.split('=')[1]));
    const { data: { user }, error } = await supabaseClient.auth.getUser(tokenData.access_token);
    
    if (error || !user) {
      return { isAdmin: false, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    if (user.email !== ADMIN_EMAIL) {
      return { isAdmin: false, error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
    }

    return { isAdmin: true };
  } catch (err) {
    return { isAdmin: false, error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }
}

export async function GET(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (!authCheck.isAdmin) return authCheck.error!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    if (usersError) throw usersError;

    const userStats = await Promise.all(
      users.map(async (user) => {
        const [identitiesRes, lastSignIn] = await Promise.all([
          supabase.from('identities').select('id', { count: 'exact' }).eq('user_id', user.id),
          Promise.resolve(user.last_sign_in_at)
        ]);

        let influencesCount = 0;
        if (identitiesRes.data && identitiesRes.data.length > 0) {
          const identityIds = identitiesRes.data.map(i => i.id);
          const categoriesRes = await supabase
            .from('categories')
            .select('id')
            .in('identity_id', identityIds);
          
          if (categoriesRes.data && categoriesRes.data.length > 0) {
            const categoryIds = categoriesRes.data.map(c => c.id);
            const influencesRes = await supabase
              .from('influences')
              .select('id', { count: 'exact' })
              .in('category_id', categoryIds);
            influencesCount = influencesRes.count || 0;
          }
        }

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          last_sign_in_at: lastSignIn,
          identities_count: identitiesRes.count || 0,
          influences_count: influencesCount,
          banned: user.banned_until ? new Date(user.banned_until) > new Date() : false,
          status: user.banned_until ? (new Date(user.banned_until) > new Date() ? 'banned' : 'active') : 'active'
        };
      })
    );

    return NextResponse.json({ users: userStats });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
