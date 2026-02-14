import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Admin auth check - only ben@unpluggedperformance.com
async function isAdmin(supabase: any): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.email === 'ben@unpluggedperformance.com';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const supabase = await createClient();
  
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    if (action === 'users') {
      // Get all auth users
      const { data: { users }, error: usersError } = await serviceClient.auth.admin.listUsers();
      if (usersError) throw usersError;

      // Get identity counts and total influence for each user
      const userStats = await Promise.all(
        users.map(async (user) => {
          // Count identities
          const { count: identityCount } = await supabase
            .from('identities')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

          // Get all categories for this user's identities
          const { data: identities } = await supabase
            .from('identities')
            .select('id')
            .eq('user_id', user.id);

          const identityIds = identities?.map(i => i.id) || [];

          let totalInfluences = 0;
          if (identityIds.length > 0) {
            const { data: categories } = await supabase
              .from('categories')
              .select('id')
              .in('identity_id', identityIds);

            const categoryIds = categories?.map(c => c.id) || [];

            if (categoryIds.length > 0) {
              const { count: influenceCount } = await supabase
                .from('influences')
                .select('*', { count: 'exact', head: true })
                .in('category_id', categoryIds);

              totalInfluences = influenceCount || 0;
            }
          }

          return {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            last_sign_in_at: user.last_sign_in_at,
            banned: user.banned_until ? new Date(user.banned_until) > new Date() : false,
            identity_count: identityCount || 0,
            total_influences: totalInfluences,
          };
        })
      );

      return NextResponse.json({ users: userStats });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  const supabase = await createClient();
  
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const body = await request.json();

    if (action === 'ban') {
      const { userId, ban } = body;
      
      if (ban) {
        // Ban for 100 years (effectively permanent)
        const banUntil = new Date();
        banUntil.setFullYear(banUntil.getFullYear() + 100);

        const { error } = await serviceClient.auth.admin.updateUserById(userId, {
          ban_duration: '876000h' // 100 years in hours
        });

        if (error) throw error;
      } else {
        // Unban
        const { error } = await serviceClient.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });

        if (error) throw error;
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'reset-password') {
      const { userId, newPassword } = body;

      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const { error } = await serviceClient.auth.admin.updateUserById(userId, {
        password: newPassword
      });

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'delete-user') {
      const { userId } = body;

      // Delete user's identities (cascades to categories and influences)
      const { data: identities } = await supabase
        .from('identities')
        .select('id')
        .eq('user_id', userId);

      if (identities) {
        for (const identity of identities) {
          await supabase
            .from('categories')
            .delete()
            .eq('identity_id', identity.id);
        }

        await supabase
          .from('identities')
          .delete()
          .eq('user_id', userId);
      }

      // Delete auth user
      const { error } = await serviceClient.auth.admin.deleteUser(userId);

      if (error) throw error;

      return NextResponse.json({ success: true });
    }

    if (action === 'invite') {
      const { email, password } = body;

      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      if (password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      // Create user
      const { data, error } = await serviceClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true
      });

      if (error) throw error;

      return NextResponse.json({ success: true, user: data.user });
    }

    if (action === 'login-as') {
      const { userId } = body;

      // Get current admin user
      const { data: { user: adminUser } } = await supabase.auth.getUser();
      if (!adminUser) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }

      // Get target user details
      const { data: targetUser, error: userError } = await serviceClient.auth.admin.getUserById(userId);
      if (userError) throw userError;

      // Generate a password reset token and use it to create a session
      // This is a workaround since Supabase doesn't have a direct "login as user" API
      const { data: resetData, error: resetError } = await serviceClient.auth.admin.generateLink({
        type: 'magiclink',
        email: targetUser.user.email!
      });

      if (resetError) throw resetError;

      // Return session info (frontend will use the magic link to establish session)
      return NextResponse.json({
        success: true,
        targetUser: {
          id: targetUser.user.id,
          email: targetUser.user.email
        },
        magicLink: resetData.properties.action_link,
        adminUserId: adminUser.id,
        adminEmail: adminUser.email
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
