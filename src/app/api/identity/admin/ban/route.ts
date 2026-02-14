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

export async function POST(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (!authCheck.isAdmin) return authCheck.error!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { userId, banned } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const bannedUntil = banned ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString() : 'none';
    
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: bannedUntil,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: banned ? `User ${user.email} banned` : `User ${user.email} unbanned` 
    });
  } catch (error: any) {
    console.error('Error updating ban status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
