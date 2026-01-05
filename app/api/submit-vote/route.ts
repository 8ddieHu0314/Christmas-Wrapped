import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { calendarOwnerId, answers, inviteToken } = await request.json();

    // Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please log in to vote' }, { status: 401 });
    }

    // Prevent self-voting
    if (user.id === calendarOwnerId) {
      return NextResponse.json({ error: 'You cannot vote on your own calendar' }, { status: 400 });
    }

    // Check if voting is still enabled for this calendar
    const { data: calendarOwner, error: ownerError } = await supabase
      .from('users')
      .select('voting_enabled, voting_deadline')
      .eq('id', calendarOwnerId)
      .single();

    if (ownerError || !calendarOwner) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    if (!calendarOwner.voting_enabled) {
      return NextResponse.json({ error: 'Voting has been closed for this calendar' }, { status: 400 });
    }

    // Check if past voting deadline
    if (calendarOwner.voting_deadline && new Date() > new Date(calendarOwner.voting_deadline)) {
      return NextResponse.json({ error: 'Voting deadline has passed' }, { status: 400 });
    }

    // Check for duplicate votes from this user for this calendar
    const { data: existingVotes } = await supabase
      .from('votes')
      .select('id')
      .eq('calendar_owner_id', calendarOwnerId)
      .eq('voter_id', user.id)
      .limit(1);

    if (existingVotes && existingVotes.length > 0) {
      return NextResponse.json({ error: 'You have already voted for this calendar!' }, { status: 400 });
    }

    // Validate answers
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Fetch all categories to validate
    const { data: categories } = await supabase
      .from('categories')
      .select('id');

    const validCategoryIds = new Set(categories?.map(c => c.id) || []);

    // Build votes to insert
    const votesToInsert = [];
    for (const [categoryId, answer] of Object.entries(answers)) {
      const catId = parseInt(categoryId);
      
      if (!validCategoryIds.has(catId)) {
        continue; // Skip invalid category IDs
      }

      const trimmedAnswer = String(answer).trim();
      if (!trimmedAnswer) {
        continue; // Skip empty answers
      }

      votesToInsert.push({
        calendar_owner_id: calendarOwnerId,
        voter_id: user.id,
        category_id: catId,
        answer: trimmedAnswer.substring(0, 500), // Enforce max length
      });
    }

    if (votesToInsert.length === 0) {
      return NextResponse.json({ error: 'No valid answers to submit' }, { status: 400 });
    }

    // Insert all votes
    const { error: insertError } = await supabase.from('votes').insert(votesToInsert);

    if (insertError) {
      console.error('Vote insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save votes' }, { status: 500 });
    }

    // Update invitation status if invite token provided
    if (inviteToken) {
      await supabase
        .from('invitations')
        .update({ status: 'voted', accepted_by: user.id })
        .eq('invite_token', inviteToken);
    } else {
      // Try to find and update invitation by email
      const { data: userData } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .single();

      if (userData?.email) {
        await supabase
          .from('invitations')
          .update({ status: 'voted', accepted_by: user.id })
          .eq('email', userData.email)
          .eq('sender_id', calendarOwnerId);
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully submitted ${votesToInsert.length} answers`
    });

  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
