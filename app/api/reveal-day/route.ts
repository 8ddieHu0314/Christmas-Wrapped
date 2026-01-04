import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isDateUnlocked } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { day, testMode } = await request.json();
    
    const { "data": { user }, "error": authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ "error": 'Unauthorized' }, { "status": 401 });
    }

    // Verify date unlock
    if (!isDateUnlocked(day, testMode)) {
      return NextResponse.json({ "error": 'This day is still locked!' }, { "status": 403 });
    }

    // Record reveal
    await supabase
      .from('reveals')
      .insert({ "user_id": user.id, "category_id": day })
      .select()
      .maybeSingle(); // Ignore if already exists due to unique constraint

    // Fetch results for this category
    // Day 1 = Category 1, etc.
    const categoryId = day;

    // Special case for Day 9 (Personal Notes)
    if (day === 9) {
      const { "data": notes } = await supabase
        .from('votes')
        .select('personal_note')
        .eq('calendar_owner_id', user.id)
        .eq('category_id', categoryId)
        .not('personal_note', 'is', null);
        
      return NextResponse.json({
        success: true,
        type: 'notes',
        data: notes?.map(n => n.personal_note) || []
      });
    }

    // Standard categories: Calculate winner
    const { "data": votes } = await supabase
      .from('votes')
      .select('option_id')
      .eq('calendar_owner_id', user.id)
      .eq('category_id', categoryId);

    if (!votes || votes.length === 0) {
      return NextResponse.json({
        success: true,
        type: 'options',
        data: [],
        message: 'No votes received yet!'
      });
    }

    // Count votes
    const counts: Record<number, number> = {};
    votes.forEach((v: any) => {
      if (v.option_id) counts[v.option_id] = (counts[v.option_id] || 0) + 1;
    });

    // Find max votes
    let maxVotes = 0;
    Object.values(counts).forEach(c => {
      if (c > maxVotes) maxVotes = c;
    });

    // Get winning option IDs
    const winningOptionIds = Object.keys(counts)
      .filter(id => counts[parseInt(id)] === maxVotes)
      .map(id => parseInt(id));

    // Fetch option details
    const { "data": winningOptions } = await supabase
      .from('options')
      .select('*')
      .in('id', winningOptionIds);

    return NextResponse.json({
      success: true,
      type: 'options',
      data: winningOptions?.map(opt => ({
        ...opt,
        voteCount: maxVotes
      })) || []
    });

  } catch (error) {
    console.error('Reveal error:', error);
    return NextResponse.json({ "error": 'Internal server error' }, { "status": 500 });
  }
}