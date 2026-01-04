import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { calendarOwnerId, votes, personalNote } = await request.json();
    
    // Get IP address
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    // Check for duplicate votes from this IP for this calendar
    // We check if there are any votes from this IP for this owner
    const { "data": existingVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('calendar_owner_id', calendarOwnerId)
      .eq('voter_ip', ip)
      .limit(1);

    if (existingVotes && existingVotes.length > 0) {
      return NextResponse.json({ "error": 'You have already voted for this calendar!' }, { "status": 400 });
    }

    const votesToInsert = [];
    
    // Process standard votes
    for (const [categoryId, optionId] of Object.entries(votes)) {
      votesToInsert.push({
        calendar_owner_id: calendarOwnerId,
        category_id: parseInt(categoryId),
        option_id: optionId,
        voter_ip: ip,
      });
    }

    // Process personal note (Category 9)
    if (personalNote && personalNote.trim()) {
      // Find category ID for personal_note
      const { "data": noteCat } = await supabase
        .from('categories')
        .select('id')
        .eq('code', 'personal_note')
        .single();
        
      if (noteCat) {
        votesToInsert.push({
          calendar_owner_id: calendarOwnerId,
          category_id: noteCat.id,
          option_id: null, // No option for text note
          voter_ip: ip,
          personal_note: personalNote.substring(0, 500),
        });
      }
    }

    if (votesToInsert.length === 0) {
      return NextResponse.json({ "error": 'No votes to submit' }, { "status": 400 });
    }

    const { error } = await supabase.from('votes').insert(votesToInsert);

    if (error) {
      console.error('Vote insert error:', error);
      return NextResponse.json({ "error": 'Failed to save votes' }, { "status": 500 });
    }

    return NextResponse.json({ "success": true });
  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json({ "error": 'Internal server error' }, { "status": 500 });
  }
}