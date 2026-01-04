import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

function generateUniqueCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get authenticated user
    const { "data": { user }, "error": authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ "error": 'Unauthorized' }, { "status": 401 });
    }
    
    // Check if user already has a calendar_code
    const { "data": existingUser, "error": fetchError } = await supabase
      .from('users')
      .select('calendar_code')
      .eq('id', user.id)
      .single();
    
    if (fetchError) {
      console.error('Fetch error:', fetchError);
      return NextResponse.json({ "error": 'Database error' }, { "status": 500 });
    }
    
    if (existingUser?.calendar_code) {
      return NextResponse.json({ 
        success: true, 
        calendar_code: existingUser.calendar_code,
        message: 'Calendar already exists'
      });
    }
    
    // Generate unique code and verify uniqueness
    let calendar_code = generateUniqueCode();
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 10) {
      const { "data": existing } = await supabase
        .from('users')
        .select('id')
        .eq('calendar_code', calendar_code)
        .maybeSingle();
      
      if (!existing) {
        isUnique = true;
      } else {
        calendar_code = generateUniqueCode();
        attempts++;
      }
    }
    
    if (!isUnique) {
      return NextResponse.json({ "error": 'Could not generate unique code' }, { "status": 500 });
    }
    
    // Update user with calendar_code
    const { "error": updateError } = await supabase
      .from('users')
      .update({ calendar_code })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({ "error": 'Failed to update calendar code' }, { "status": 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      calendar_code,
      message: 'Calendar generated successfully!'
    });
  } catch (error) {
    console.error('Generate calendar error:', error);
    return NextResponse.json({ "error": 'Internal server error' }, { "status": 500 });
  }
}