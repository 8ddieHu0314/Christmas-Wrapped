-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  calendar_code TEXT UNIQUE,
  voting_enabled BOOLEAN DEFAULT TRUE,
  voting_deadline TIMESTAMP WITH TIME ZONE DEFAULT '2025-12-15 23:59:59+00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_calendar_code ON users(calendar_code);

-- Categories Table (simplified - no more predefined options)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt TEXT, -- The question to ask voters
  display_order INTEGER
);

-- Invitations Table (NEW - track email invites)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, voted
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for invitation lookups
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invite_token);

-- Votes Table (restructured - free-text answers linked to voter accounts)
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  answer TEXT NOT NULL, -- Free-text answer (max 500 chars enforced in app)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate votes from same voter for same calendar/category
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_vote ON votes(calendar_owner_id, voter_id, category_id);

-- Create index for faster vote lookups
CREATE INDEX IF NOT EXISTS idx_votes_calendar_owner ON votes(calendar_owner_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);

-- Reveals Table
CREATE TABLE IF NOT EXISTS reveals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER,
  revealed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- Trigger to create public user record on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Function to auto-accept invitation when user signs up with invited email
CREATE OR REPLACE FUNCTION public.handle_invitation_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.invitations
  SET status = 'accepted', accepted_by = new.id
  WHERE email = new.email AND status = 'pending';
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_user_accept_invitation ON public.users;
CREATE TRIGGER on_user_accept_invitation
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_invitation_acceptance();

-- SEED DATA

-- Clear existing data to avoid duplicates on re-run
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- Insert Categories with prompts for free-text answers
INSERT INTO categories (id, name, code, description, prompt, display_order) VALUES
(1, 'Animal', 'animal', 'Animal that best represents them', 'What animal best represents this person and why?', 1),
(2, 'Place', 'place', 'A place that fits their vibe', 'What place (city, country, or location) fits their vibe and why?', 2),
(3, 'Plant', 'plant', 'Plant personality match', 'What plant or flower reminds you of this person and why?', 3),
(4, 'Season', 'season', 'Their season energy', 'What season best matches their personality and why?', 4),
(5, 'Hobby', 'hobby', 'A hobby they would master', 'What hobby do you think they would master and why?', 5),
(6, 'Food', 'food', 'Their comfort food soulmate', 'What food or dish represents them best and why?', 6),
(7, 'Colour', 'colour', 'Their aura colour', 'What colour represents their aura or personality and why?', 7),
(8, 'Character', 'character', 'Fictional character twin', 'What fictional character are they most like and why?', 8),
(9, 'Personal Note', 'personal_note', 'A heartfelt message', 'Write a personal Christmas message to them:', 9);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;

-- Users: Public read (for voting), Self update
CREATE POLICY "Public users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Categories: Public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Invitations: Owner can manage, invited user can view their invitations
CREATE POLICY "Users can view their sent invitations" ON invitations FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can view invitations sent to them" ON invitations FOR SELECT USING (email = (SELECT email FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert invitations" ON invitations FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their invitations" ON invitations FOR UPDATE USING (auth.uid() = sender_id);

-- Votes: Authenticated insert, Owner can view votes for their calendar
CREATE POLICY "Authenticated users can insert votes" ON votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users can view votes for their calendar" ON votes FOR SELECT USING (auth.uid() = calendar_owner_id);
CREATE POLICY "Voters can view their own votes" ON votes FOR SELECT USING (auth.uid() = voter_id);

-- Reveals: Self read/insert
CREATE POLICY "Users can manage own reveals" ON reveals FOR ALL USING (auth.uid() = user_id);
