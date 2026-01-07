import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { isDateUnlocked } from '@/lib/date-utils';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { day, testMode } = await request.json();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify date unlock
    if (!isDateUnlocked(day, testMode)) {
      return NextResponse.json({ error: 'This day is still locked!' }, { status: 403 });
    }

    // Record reveal (if not already revealed)
    await supabase
      .from('reveals')
      .insert({ user_id: user.id, category_id: day })
      .select()
      .maybeSingle();

    // Day 1 = Category 1, etc.
    const categoryId = day;

    // Fetch category info
    const { data: category } = await supabase
      .from('categories')
      .select('name, description, code')
      .eq('id', categoryId)
      .single();

    // Fetch all answers for this category with vote counts
    const { data: answers, error: answersError } = await supabase
      .from('category_answers')
      .select('id, answer, vote_count')
      .eq('calendar_owner_id', user.id)
      .eq('category_id', categoryId)
      .order('vote_count', { ascending: false });

    if (answersError) {
      console.error('Answers fetch error:', answersError);
      return NextResponse.json({ error: 'Failed to fetch answers' }, { status: 500 });
    }

    if (!answers || answers.length === 0) {
      return NextResponse.json({
        success: true,
        category: category,
        type: 'answers',
        answers: [],
        totalVotes: 0,
        message: 'No votes received yet for this category!'
      });
    }

    // For each answer, fetch the voters who voted for it
    const answersWithVoters = await Promise.all(
      answers.map(async (answer) => {
        const { data: voters } = await supabase
          .from('votes')
          .select(`
            voter_id,
            users!votes_voter_id_fkey (name, email)
          `)
          .eq('answer_id', answer.id);

        const voterNames = voters?.map(v => {
          const user = v.users as any;
          return user?.name || user?.email?.split('@')[0] || 'Anonymous';
        }) || [];

        return {
          id: answer.id,
          answer: answer.answer,
          voteCount: answer.vote_count,
          voters: voterNames
        };
      })
    );

    // Calculate total votes
    const totalVotes = answers.reduce((sum, a) => sum + a.vote_count, 0);

    // Find the winner (most votes)
    const winner = answersWithVoters[0];

    return NextResponse.json({
      success: true,
      category: category,
      type: category?.code === 'personal_note' ? 'notes' : 'answers',
      answers: answersWithVoters,
      winner: winner,
      totalVotes: totalVotes
    });

  } catch (error) {
    console.error('Reveal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
