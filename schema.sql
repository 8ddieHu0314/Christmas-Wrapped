-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  calendar_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_calendar_code ON users(calendar_code);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  prompt TEXT,
  display_order INTEGER
);

-- Invitations Table
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, accepted, voted
  accepted_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invite_token TEXT UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_sender ON invitations(sender_id);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(invite_token);

-- Category Answers Table (stores unique answers with vote counts)
-- Each unique answer per calendar/category is stored once with a vote_count
CREATE TABLE IF NOT EXISTS category_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  vote_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calendar_owner_id, category_id, answer) -- one entry per unique answer
);

CREATE INDEX IF NOT EXISTS idx_category_answers_owner ON category_answers(calendar_owner_id);
CREATE INDEX IF NOT EXISTS idx_category_answers_category ON category_answers(category_id);

-- Votes Table (tracks who voted for which answer)
-- This allows us to show voter names and prevent duplicate votes
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  answer_id UUID REFERENCES category_answers(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calendar_owner_id, voter_id, category_id) -- one vote per voter per category
);

CREATE INDEX IF NOT EXISTS idx_votes_calendar_owner ON votes(calendar_owner_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_answer ON votes(answer_id);

-- Reveals Table
CREATE TABLE IF NOT EXISTS reveals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER,
  revealed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, category_id)
);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger to create public user record on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (new.id, new.email, COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'name'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to auto-accept invitation when user signs up with invited email
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

-- ============================================
-- SEED DATA
-- ============================================

TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

INSERT INTO categories (id, name, code, description, prompt, display_order) VALUES
(1, 'Animal', 'animal', 'Animal that best represents them', 'What animal best represents this person?', 1),
(2, 'Place', 'place', 'A place that fits their vibe', 'What place fits their vibe?', 2),
(3, 'Plant', 'plant', 'Plant personality match', 'What plant reminds you of them?', 3),
(4, 'Season', 'season', 'Their season energy', 'What season matches their personality?', 4),
(5, 'Hobby', 'hobby', 'A hobby they would master', 'What hobby would they master?', 5),
(6, 'Food', 'food', 'Their comfort food soulmate', 'What food represents them?', 6),
(7, 'Colour', 'colour', 'Their aura colour', 'What colour is their aura?', 7),
(8, 'Character', 'character', 'Fictional character twin', 'What character are they most like?', 8),
(9, 'Personal Note', 'personal_note', 'A heartfelt message', 'Write a message to them:', 9);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Public users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Categories policies
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);

-- Invitations policies
CREATE POLICY "Users can view their sent invitations" ON invitations FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can view invitations sent to them" ON invitations FOR SELECT USING (email = (SELECT email FROM users WHERE id = auth.uid()));
CREATE POLICY "Users can insert invitations" ON invitations FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update their invitations" ON invitations FOR UPDATE USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete their invitations" ON invitations FOR DELETE USING (auth.uid() = sender_id);

-- Category Answers policies
CREATE POLICY "Calendar owners can view their answers" ON category_answers FOR SELECT USING (auth.uid() = calendar_owner_id);
CREATE POLICY "Voters can view answers they voted for" ON category_answers FOR SELECT USING (
  EXISTS (SELECT 1 FROM votes WHERE votes.answer_id = category_answers.id AND votes.voter_id = auth.uid())
);
CREATE POLICY "Authenticated users can insert answers" ON category_answers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update vote counts" ON category_answers FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Votes policies
CREATE POLICY "Calendar owners can view votes" ON votes FOR SELECT USING (auth.uid() = calendar_owner_id);
CREATE POLICY "Voters can view their own votes" ON votes FOR SELECT USING (auth.uid() = voter_id);
CREATE POLICY "Authenticated users can insert votes" ON votes FOR INSERT WITH CHECK (auth.uid() = voter_id);

-- Reveals policies
CREATE POLICY "Users can manage own reveals" ON reveals FOR ALL USING (auth.uid() = user_id);
