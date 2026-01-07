import { createClient, createAdminClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { isVotingOpen } from '@/lib/date-utils';
import { normalizeAnswer } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    // Use regular client for auth, admin client for database operations
    const supabase = await createClient();
    const supabaseAdmin = createAdminClient();
    const { calendarOwnerId, answers } = await request.json();

    // Check if voting deadline has passed (same for everyone - Dec 15)
    if (!isVotingOpen()) {
      return NextResponse.json({ error: 'Voting deadline has passed (Dec 15)' }, { status: 400 });
    }

    // Authenticate user (validates JWT from cookies)
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Please log in to vote' }, { status: 401 });
    }

    // Prevent self-voting
    if (user.id === calendarOwnerId) {
      return NextResponse.json({ error: 'You cannot vote on your own calendar' }, { status: 400 });
    }

    // Verify calendar owner exists (use admin client for DB operations)
    const { data: calendarOwner, error: ownerError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', calendarOwnerId)
      .single();

    if (ownerError || !calendarOwner) {
      return NextResponse.json({ error: 'Calendar not found' }, { status: 404 });
    }

    // Validate answers
    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: 'No answers provided' }, { status: 400 });
    }

    // Fetch all categories to validate
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('id');

    const validCategoryIds = new Set(categories?.map(c => c.id) || []);

    // Submit each vote using admin client
    const results = [];
    const errors = [];

    for (const [categoryId, answer] of Object.entries(answers)) {
      const catId = parseInt(categoryId);
      
      if (!validCategoryIds.has(catId)) {
        continue; // Skip invalid category IDs
      }

      // Normalize answer in TypeScript (lowercase, a-z and spaces only)
      const normalizedAnswer = normalizeAnswer(String(answer));
      if (!normalizedAnswer) {
        continue; // Skip empty answers
      }

      // Check if user already voted for this category
      const { data: existingVote } = await supabaseAdmin
        .from('votes')
        .select('id')
        .eq('calendar_owner_id', calendarOwnerId)
        .eq('voter_id', user.id)
        .eq('category_id', catId)
        .maybeSingle();

      if (existingVote) {
        errors.push({ category: catId, error: 'Already voted for this category' });
        continue;
      }

      // Check if this answer already exists
      const { data: existingAnswer } = await supabaseAdmin
        .from('category_answers')
        .select('id, vote_count')
        .eq('calendar_owner_id', calendarOwnerId)
        .eq('category_id', catId)
        .eq('answer', normalizedAnswer.substring(0, 500))
        .maybeSingle();

      let answerId: string;

      if (existingAnswer) {
        // Answer exists - increment vote count
        await supabaseAdmin
          .from('category_answers')
          .update({ 
            vote_count: existingAnswer.vote_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingAnswer.id);
        
        answerId = existingAnswer.id;
      } else {
        // New answer - create with vote_count = 1
        const { data: newAnswer, error: insertError } = await supabaseAdmin
          .from('category_answers')
          .insert({
            calendar_owner_id: calendarOwnerId,
            category_id: catId,
            answer: normalizedAnswer.substring(0, 500),
            vote_count: 1,
          })
          .select('id')
          .single();

        if (insertError || !newAnswer) {
          console.error(`Insert answer error for category ${catId}:`, insertError);
          errors.push({ category: catId, error: insertError?.message || 'Failed to save answer' });
          continue;
        }
        answerId = newAnswer.id;
      }

      // Record the vote
      const { error: voteError } = await supabaseAdmin
        .from('votes')
        .insert({
          calendar_owner_id: calendarOwnerId,
          voter_id: user.id,
          category_id: catId,
          answer_id: answerId,
        });

      if (voteError) {
        console.error(`Vote error for category ${catId}:`, voteError);
        errors.push({ category: catId, error: voteError.message });
      } else {
        results.push({ answer: normalizedAnswer, category: catId });
      }
    }

    if (results.length === 0 && errors.length > 0) {
      return NextResponse.json({ 
        error: errors[0]?.error || 'Failed to submit votes' 
      }, { status: 400 });
    }

    // Update invitation status to 'voted'
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    if (userData?.email) {
      await supabaseAdmin
        .from('invitations')
        .update({ status: 'voted', accepted_by: user.id })
        .eq('email', userData.email)
        .eq('sender_id', calendarOwnerId);
    }

    return NextResponse.json({ 
      success: true,
      message: `Successfully submitted ${results.length} answers`,
      submitted: results.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Submit vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
