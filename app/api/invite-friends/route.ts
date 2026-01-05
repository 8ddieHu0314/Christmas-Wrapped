import { createClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { emails } = await request.json();

    // Validate input
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'Please provide at least one email' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validEmails = emails.filter((email: string) => emailRegex.test(email.trim()));
    
    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's data including calendar_code and name
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('calendar_code, name')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.calendar_code) {
      return NextResponse.json({ error: 'Please generate your calendar first' }, { status: 400 });
    }

    // Check for existing invitations to avoid duplicates
    const { data: existingInvites } = await supabase
      .from('invitations')
      .select('email')
      .eq('sender_id', user.id)
      .in('email', validEmails.map((e: string) => e.toLowerCase().trim()));

    const existingEmails = new Set(existingInvites?.map(i => i.email.toLowerCase()) || []);
    const newEmails = validEmails.filter((email: string) => 
      !existingEmails.has(email.toLowerCase().trim())
    );

    if (newEmails.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'All emails have already been invited',
        invited: 0,
        skipped: validEmails.length
      });
    }

    // Create invitation records
    const invitationsToInsert = newEmails.map((email: string) => ({
      sender_id: user.id,
      email: email.toLowerCase().trim(),
      status: 'pending'
    }));

    const { data: insertedInvites, error: insertError } = await supabase
      .from('invitations')
      .insert(invitationsToInsert)
      .select('id, email, invite_token');

    if (insertError) {
      console.error('Invitation insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create invitations' }, { status: 500 });
    }

    // Generate invite URLs for each invitation
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteLinks = insertedInvites?.map(invite => ({
      email: invite.email,
      link: `${baseUrl}/vote/${userData.calendar_code}?invite=${invite.invite_token}`
    })) || [];

    // TODO: Send actual emails via Resend/SendGrid/Supabase Edge Functions
    // For now, we just return the invite links that can be shared manually
    // In production, you would integrate with an email service here:
    //
    // await sendEmail({
    //   to: invite.email,
    //   subject: `${userData.name} invited you to vote on their Christmas Advent Calendar!`,
    //   body: `Click here to vote: ${inviteLink}`
    // });

    return NextResponse.json({
      success: true,
      message: `Successfully created ${newEmails.length} invitation(s)`,
      invited: newEmails.length,
      skipped: validEmails.length - newEmails.length,
      inviteLinks // Return links so user can share them
    });

  } catch (error) {
    console.error('Invite friends error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET endpoint to fetch current invitations
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's calendar code
    const { data: userData } = await supabase
      .from('users')
      .select('calendar_code')
      .eq('id', user.id)
      .single();

    // Fetch all invitations sent by this user
    const { data: invitations, error: invitesError } = await supabase
      .from('invitations')
      .select(`
        id,
        email,
        status,
        invite_token,
        created_at,
        accepted_by
      `)
      .eq('sender_id', user.id)
      .order('created_at', { ascending: false });

    if (invitesError) {
      console.error('Fetch invitations error:', invitesError);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    // For each accepted invitation, check if they have voted
    const invitationsWithVoteStatus = await Promise.all(
      (invitations || []).map(async (invite) => {
        let hasVoted = false;
        if (invite.accepted_by) {
          const { data: votes } = await supabase
            .from('votes')
            .select('id')
            .eq('calendar_owner_id', user.id)
            .eq('voter_id', invite.accepted_by)
            .limit(1);
          hasVoted = (votes?.length || 0) > 0;
        }
        return {
          ...invite,
          hasVoted,
          calendar_code: userData?.calendar_code
        };
      })
    );

    return NextResponse.json({
      success: true,
      invitations: invitationsWithVoteStatus
    });

  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE endpoint to remove an invitation
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const { invitationId } = await request.json();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('invitations')
      .delete()
      .eq('id', invitationId)
      .eq('sender_id', user.id);

    if (deleteError) {
      console.error('Delete invitation error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete invitation' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Delete invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

