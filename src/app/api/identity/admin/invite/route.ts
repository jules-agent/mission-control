import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

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
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const userExists = existingUsers?.users.some(u => u.email === email);
    
    if (userExists) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const inviteToken = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://jules3000.com';
    const signupUrl = `${baseUrl}/identity/login?email=${encodeURIComponent(email)}&invite=${inviteToken}`;

    return NextResponse.json({
      success: true,
      message: `Invite created for ${email}`,
      signupUrl,
      inviteToken,
    });
  } catch (error: any) {
    console.error('Error creating invite:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const authCheck = await checkAdminAuth(request);
  if (!authCheck.isAdmin) return authCheck.error!;

  return NextResponse.json({ invites: [] });
}
