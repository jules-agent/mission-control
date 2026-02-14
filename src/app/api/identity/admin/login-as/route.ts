import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { randomBytes } from 'crypto';

const ADMIN_EMAIL = 'ben@unpluggedperformance.com';
const SUPABASE_URL = 'https://nqikobnkhpyfduqgfrew.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xaWtvYm5raHB5ZmR1cWdmcmV3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDMyNjg1MCwiZXhwIjoyMDg1OTAyODUwfQ.2tuEjmqh6yU37IOqXVB56MLFqxjKuInqLQu9ml6C8o0';

async function checkAdminAuth(request: Request): Promise<{ user: any; error?: NextResponse }> {
  const authHeader = request.headers.get('cookie');
  if (!authHeader) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  
  const cookies = authHeader.split(';').map(c => c.trim());
  const accessTokenCookie = cookies.find(c => c.startsWith('sb-nqikobnkhpyfduqgfrew-auth-token'));
  
  if (!accessTokenCookie) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  try {
    const tokenData = JSON.parse(decodeURIComponent(accessTokenCookie.split('=')[1]));
    const { data: { user }, error } = await supabaseClient.auth.getUser(tokenData.access_token);
    
    if (error || !user) {
      return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
    }

    if (user.email !== ADMIN_EMAIL) {
      return { user: null, error: NextResponse.json({ error: 'Admin access required' }, { status: 403 }) };
    }

    return { user };
  } catch (err) {
    return { user: null, error: NextResponse.json({ error: 'Invalid session' }, { status: 401 }) };
  }
}

export async function POST(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (!authCheck.user) return authCheck.error!;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { targetUserId } = await request.json();
    
    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID required' }, { status: 400 });
    }

    const { data: { user: targetUser }, error: targetError } = await supabase.auth.admin.getUserById(targetUserId);
    
    if (targetError || !targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const cookieStore = await cookies();
    cookieStore.set('impersonation_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    cookieStore.set('impersonation_target_id', targetUserId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      token,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
      },
    });
  } catch (error: any) {
    console.error('Error starting impersonation:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('impersonation_token');
  cookieStore.delete('impersonation_target_id');
  
  return NextResponse.json({ success: true });
}
