import { supabase } from './supabaseClient';

export const signupUser = async (email, password, userData) => {
  try {
    const { data: authData, error: signupError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signupError) return { user: null, error: signupError.message };

    const user = authData.user;
    if (!user) return { user: null, error: 'Signup failed — no user returned. Email confirmation may be required.' };

    // Small delay to ensure auth user is fully created before profile insert
    await new Promise(resolve => setTimeout(resolve, 500));

    const profileData = {
      id:                        user.id,
      name:                      userData.name,
      email:                     email,
      role:                      userData.role        || 'freelancer',
      designation:               userData.designation || '',
      status:                    'active',
      requires_legal_acceptance: true,  // MUST be true for new signups
    };

    console.log('Creating profile with:', profileData);

    const { error: profileError } = await supabase
      .from('users')
      .upsert(profileData, {
        onConflict:       'id',
        ignoreDuplicates: false,  // Always update if exists
      });

    if (profileError) {
      console.error('Profile upsert error:', profileError);
      return { user: null, error: `Profile setup failed: ${profileError.message}` };
    }

    console.log('✅ Profile created with requires_legal_acceptance: true');
    return { user, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

export const loginUser = async (email, password) => {
  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return { user: null, error: authError.message, isSuspended: false };

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.warn('Profile fetch warning:', profileError.message);
      return { user: data.user, error: null, isSuspended: false };
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      return { user: null, error: 'Account suspended', isSuspended: true };
    }

    // Always return { user } not { session } so AuthContext destructuring works
    return { user: { ...data.user, ...profile }, error: null, isSuspended: false };
  } catch (err) {
    return { user: null, error: err.message, isSuspended: false };
  }
};

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { success: !error, error: error?.message || null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) return { user: null, error: sessionError?.message };

    const { data: profile, error: profileError } = await supabase
      .from('users').select('*').eq('id', session.user.id).single();

    if (profileError) return { user: session.user, error: null };
    return { user: { ...session.user, ...profile }, error: null };
  } catch (err) {
    return { user: null, error: err.message };
  }
};

