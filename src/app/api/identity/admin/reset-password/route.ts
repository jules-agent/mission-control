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
    const { userId, action } = await request.json();
    
    if (!userId || !action) {
      return NextResponse.json({ error: 'Missing userId or action' }, { status: 400 });
    }

    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (action === 'send_email') {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://jules3000.com'}/identity/login`,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Password reset email sent to ${user.email}` 
      });
    } else if (action === 'manual_reset') {
      const tempPassword = `Temp${Math.random().toString(36).slice(2, 10)}!${Date.now().toString().slice(-4)}`;

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: tempPassword,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        success: true, 
        tempPassword,
        message: 'Password reset successfully' 
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
