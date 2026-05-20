/**
 * Supabase Setup Helper
 * 
 * This file helps verify if your Supabase is properly configured for the profile feature
 * Run this in your browser console to check the setup
 * 
 * Steps:
 * 1. Start your app: npm start
 * 2. Log in to your account
 * 3. Open browser console: F12 → Console tab
 * 4. Copy-paste this entire file and run it
 */

import { supabase } from './supabaseClient';

export const checkSupabaseSetup = async () => {
  console.log('🔍 Checking Supabase setup...\n');

  const checks = {
    databaseConnection: false,
    profileImageUrlColumn: false,
    updatedAtColumn: false,
    profilePicturesBucket: false,
    storagePermissions: false,
  };

  try {
    // Check 1: Database Connection
    console.log('✓ Checking database connection...');
    const { data: testData, error: connError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (connError) {
      console.log('✗ Database connection failed:', connError.message);
    } else {
      console.log('✓ Database connected successfully');
      checks.databaseConnection = true;
    }

    // Check 2: profile_image_url column
    console.log('\n✓ Checking profile_image_url column...');
    const { data: userData, error: imageError } = await supabase
      .from('users')
      .select('id, profile_image_url')
      .limit(1);

    if (imageError?.message.includes('profile_image_url')) {
      console.log('✗ profile_image_url column not found');
      console.log('  Run this SQL in Supabase:\n  ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT NULL;');
    } else {
      console.log('✓ profile_image_url column exists');
      checks.profileImageUrlColumn = true;
    }

    // Check 3: updated_at column
    console.log('\n✓ Checking updated_at column...');
    const { data: updatedData, error: updateError } = await supabase
      .from('users')
      .select('id, updated_at')
      .limit(1);

    if (updateError?.message.includes('updated_at')) {
      console.log('✗ updated_at column not found');
      console.log('  Run this SQL in Supabase:\n  ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();');
    } else {
      console.log('✓ updated_at column exists');
      checks.updatedAtColumn = true;
    }

    // Check 4: profile-pictures bucket
    console.log('\n✓ Checking profile-pictures bucket...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();

    if (bucketError) {
      console.log('✗ Cannot list buckets:', bucketError.message);
    } else {
      const hasBucket = buckets?.some(b => b.name === 'profile-pictures');
      if (hasBucket) {
        console.log('✓ profile-pictures bucket exists');
        checks.profilePicturesBucket = true;
      } else {
        console.log('✗ profile-pictures bucket not found');
        console.log('  Create it in Supabase Dashboard:\n  Storage > Create Bucket > Name: "profile-pictures" > Public: YES');
      }
    }

    // Check 5: Storage permissions
    if (checks.profilePicturesBucket) {
      console.log('\n✓ Checking storage permissions...');
      try {
        // Try to create a test file
        const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
        const { error: uploadError } = await supabase.storage
          .from('profile-pictures')
          .upload(`test/${Date.now()}.txt`, testFile);

        if (uploadError) {
          console.log('⚠ Upload test failed (this may be expected):', uploadError.message);
          console.log('  Check RLS policies in Storage > profile-pictures > Policies');
        } else {
          console.log('✓ Storage permissions configured');
          checks.storagePermissions = true;
        }
      } catch (e) {
        console.log('⚠ Storage test error:', e.message);
      }
    }

  } catch (err) {
    console.error('❌ Setup check error:', err);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 SETUP SUMMARY:');
  console.log('='.repeat(50));

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  Object.entries(checks).forEach(([key, value]) => {
    const icon = value ? '✓' : '✗';
    console.log(`${icon} ${key.replace(/([A-Z])/g, ' $1').trim()}`);
  });

  console.log('\n' + (passed === total ? '✓ All checks passed!' : `⚠ ${total - passed} issues found`));
  console.log('\nFor detailed setup instructions, see: PROFILE_SETUP_GUIDE.md');
};

// Export for use
export default checkSupabaseSetup;
