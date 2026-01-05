import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { isDateUnlocked } from '@/lib/date-utils';

interface VoteWithVoter {
  id: string;
  answer: string;
  created_at: string;
  voter: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

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
      .maybeSingle(); // Ignore if already exists due to unique constraint

    // Day 1 = Category 1, etc.
    const categoryId = day;

    // Fetch category info
    const { data: category } = await supabase
      .from('categories')
      .select('name, description, code')
      .eq('id', categoryId)
      .single();

    // Fetch all votes for this category with voter info
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select(`
        id,
        answer,
        created_at,
        voter_id
      `)
      .eq('calendar_owner_id', user.id)
      .eq('category_id', categoryId);

    if (votesError) {
      console.error('Votes fetch error:', votesError);
      return NextResponse.json({ error: 'Failed to fetch votes' }, { status: 500 });
    }

    if (!votes || votes.length === 0) {
      return NextResponse.json({
        success: true,
        category: category,
        type: 'answers',
        answers: [],
        summary: null,
        totalVotes: 0,
        message: 'No votes received yet for this category!'
      });
    }

    // Fetch voter names for each vote
    const voterIds = [...new Set(votes.map(v => v.voter_id))];
    const { data: voters } = await supabase
      .from('users')
      .select('id, name, email')
      .in('id', voterIds);

    const voterMap = new Map(voters?.map(v => [v.id, v]) || []);

    // Build answers with voter info
    const answersWithVoters = votes.map(vote => ({
      id: vote.id,
      answer: vote.answer,
      created_at: vote.created_at,
      voterName: voterMap.get(vote.voter_id)?.name || 
                 voterMap.get(vote.voter_id)?.email?.split('@')[0] || 
                 'Anonymous'
    }));

    // Generate summary (find common words/themes or just count)
    // For simplicity, we'll show the most common first word or just the first answer
    const summary = generateSummary(answersWithVoters.map(a => a.answer));

    return NextResponse.json({
      success: true,
      category: category,
      type: category?.code === 'personal_note' ? 'notes' : 'answers',
      answers: answersWithVoters,
      summary: summary,
      totalVotes: votes.length
    });

  } catch (error) {
    console.error('Reveal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function generateSummary(answers: string[]): string | null {
  if (answers.length === 0) return null;
  if (answers.length === 1) return answers[0];

  // Simple summary: find the most common "main word" (first significant word)
  const wordCounts: Record<string, number> = {};
  const stopWords = new Set(['a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'i', 'you', 'they', 'because', 'like', 'and', 'or', 'but', 'to', 'of', 'in', 'for', 'on', 'with', 'as', 'at', 'by', 'from', 'their', 'your', 'my', 'its', 'this', 'that', 'it', 'he', 'she', 'would', 'think', 'really']);
  
  answers.forEach(answer => {
    // Get first few significant words
    const words = answer.toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
      .slice(0, 3);
    
    words.forEach(word => {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
  });

  // Find the most common significant word
  let maxCount = 0;
  let mostCommonWord = '';
  for (const [word, count] of Object.entries(wordCounts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonWord = word;
    }
  }

  if (mostCommonWord && maxCount > 1) {
    // Find the full answer that best represents this theme
    const representativeAnswer = answers.find(a => 
      a.toLowerCase().includes(mostCommonWord)
    );
    if (representativeAnswer) {
      return `"${mostCommonWord.charAt(0).toUpperCase() + mostCommonWord.slice(1)}" was mentioned ${maxCount} times`;
    }
  }

  // Fallback: return count info
  return `${answers.length} friends shared their thoughts`;
}
