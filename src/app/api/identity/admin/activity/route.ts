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
    
    if (error || !user || user.email !== ADMIN_EMAIL) {
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '100');

    const { data: { users } } = await supabase.auth.admin.listUsers();
    const userEmailMap = new Map(users.map(u => [u.id, u.email]));

    const activityLog: any[] = [];

    let query = supabase.from('identities').select('*').order('created_at', { ascending: false });
    if (userId) query = query.eq('user_id', userId);
    
    const { data: identities } = await query.limit(limit);
    
    (identities || []).forEach(identity => {
      activityLog.push({
        id: `identity-${identity.id}`,
        action: 'created_identity',
        entity_type: 'identity',
        entity_id: identity.id,
        entity_name: identity.name,
        user_id: identity.user_id,
        user_email: userEmailMap.get(identity.user_id) || 'Unknown',
        created_at: identity.created_at,
        details: { is_base: identity.is_base }
      });
    });

    const { data: influences } = await supabase
      .from('influences')
      .select('*, categories!inner(identity_id, identities!inner(user_id, name))')
      .order('created_at', { ascending: false })
      .limit(limit);

    (influences || []).forEach((inf: any) => {
      const userId = inf.categories?.identities?.user_id;
      const identityName = inf.categories?.identities?.name;
      activityLog.push({
        id: `influence-${inf.id}`,
        action: 'added_influence',
        entity_type: 'influence',
        entity_id: inf.id,
        entity_name: inf.name,
        user_id: userId,
        user_email: userEmailMap.get(userId) || 'Unknown',
        created_at: inf.created_at,
        details: { 
          alignment: inf.alignment, 
          identity: identityName 
        }
      });
    });

    activityLog.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ 
      activity: activityLog.slice(0, limit) 
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
