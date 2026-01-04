-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  calendar_code TEXT UNIQUE,
  voting_enabled BOOLEAN DEFAULT TRUE,
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
  display_order INTEGER
);

-- Options Table
CREATE TABLE IF NOT EXISTS options (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  display_order INTEGER
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  calendar_owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
  option_id INTEGER REFERENCES options(id) ON DELETE CASCADE,
  voter_ip TEXT,
  personal_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prevent duplicate votes from same IP for same calendar/category
-- Note: For personal_note (category 9), option_id is null, so we handle that logic in app or allow multiple notes if desired.
-- Here we enforce one vote per category per IP per calendar.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_vote ON votes(calendar_owner_id, category_id, voter_ip);

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

-- SEED DATA

-- Clear existing data to avoid duplicates on re-run
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

-- Insert Categories
INSERT INTO categories (id, name, code, description, display_order) VALUES
(1, 'Animal', 'animal', 'Animal Your Friend Reminds You Of', 1),
(2, 'Place', 'place', 'A Place That Fits Their Vibe', 2),
(3, 'Plant', 'plant', 'Plant Personality', 3),
(4, 'Season', 'season', 'Which Season Are They?', 4),
(5, 'Hobby', 'hobby', 'A Hobby They Would Master', 5),
(6, 'Food', 'food', 'Comfort Food Soulmate', 6),
(7, 'Colour', 'colour', 'Their Aura Colour', 7),
(8, 'Character', 'character', 'Fictional Character Twin', 8),
(9, 'Personal Note', 'personal_note', 'Write a little note to your friend', 9);

-- Insert Options

-- Category 1: Animal
INSERT INTO options (category_id, title, description, display_order) VALUES
(1, 'Puppy', 'Detective Doggo - A puppy wearing a detective hat, solving little mysteries.', 1),
(1, 'Cat', 'Yoga Guru Cat - A cat in a meditation pose, guiding others in yoga.', 2),
(1, 'Sloth', 'Speedy Sloth Racer - A sloth in racing gear, lounging in a tiny race car.', 3),
(1, 'Kangaroo', 'Boxer Kangaroo - A kangaroo in boxing gloves coaching koalas.', 4),
(1, 'Pig', 'Fashionista Pig - A stylish pig strutting down a runway.', 5),
(1, 'Panda', 'Panda Chef - A panda in a chef hat cooking bamboo dishes.', 6),
(1, 'Sheep', 'Comedic Sheep - A sheep telling puns and making everyone laugh.', 7);

-- Category 2: Place
INSERT INTO options (category_id, title, description, display_order) VALUES
(2, 'Urban City', 'Neon Space City - A lively city where dogs drive and cats serve coffee.', 1),
(2, 'Tibet Mountain Range', 'Yeti Rent-a-space - Yeti-run quirky homestays in the snow.', 2),
(2, 'European Countryside', 'Time-Traveling Village - A village where everyone dresses in historical outfits.', 3),
(2, 'Suburban American Neighborhoods', 'Gnome Spa Retreat - Lawn gnomes running a spa for homeowners.', 4),
(2, 'Hawaii Beachside', 'Turtle Surf School - Sea turtles teaching surf lessons in Hawaiian shirts.', 5),
(2, 'Fishing Lakeside', 'Mermaid B & B - Mermaids running a cozy B&B for fishermen.', 6),
(2, 'The Hood', 'Hipster Farm - An urban farm with an artisanal twist.', 7),
(2, 'Dali, Yunnan', 'Painting Paradise - Colorful houses changing with the weather.', 8),
(2, 'Space Colony', 'Galactic Pet Retreat - A future colony where pets treat their owners.', 9);

-- Category 3: Plant
INSERT INTO options (category_id, title, description, display_order) VALUES
(3, 'Man-Eating Plant', 'Prankster Plant - A plant that "eats" bad jokes, leaving everyone laughing.', 1),
(3, 'Sunflower', 'Disco Sunflower - A sunflower that dances to the music at sunrise.', 2),
(3, 'Roses (with Thorns)', 'Thorny Complimenter - A rose that offers cheeky compliments.', 3),
(3, 'Oak Tree', 'Stand-Up Comedy Oak - An oak hosting comedy nights for squirrels.', 4),
(3, 'Grape Vines', 'Wine-Whispering Vines - Vines sharing secrets about winemaking.', 5),
(3, 'Elderberry', 'Elderberry Therapist - A bush offering therapy sessions to birds.', 6),
(3, 'Peashooter', 'Rave-Ready Peashooter - A peashooter throwing confetti at parties.', 7),
(3, 'Cactus', 'Prickly Optimist - A cactus encouraging everyone to thrive.', 8);

-- Category 4: Season
INSERT INTO options (category_id, title, description, display_order) VALUES
(4, 'Spring', 'Spring Cleaning Olympics - Animals competing to decorate their homes.', 1),
(4, 'Summer', 'Ultimate Pool Party - A fun summer gathering with inflatable tacos.', 2),
(4, 'Autumn', 'Leaf-Pile Wrestling - A contest to make the biggest leaf pile for fun.', 3),
(4, 'Winter', 'Frozen Food Festival - Animals making snowmen serving treats.', 4),
(4, 'Monsoon', 'Rain Dance Rave - Animals celebrating every rain shower with a party.', 5);

-- Category 5: Hobby
INSERT INTO options (category_id, title, description, display_order) VALUES
(5, 'Tennis', 'Playing tennis with perfect timing, moving smoothly across the court.', 1),
(5, 'Bass Guitar', 'Shredding on the bass, lost in the intense rhythm of a heavy-metal song.', 2),
(5, 'Drums Rock n Roll', 'Hitting the drums with energy, driving the beat.', 3),
(5, 'Singing Classical', 'Belting out opera arias with precision and emotional power.', 4),
(5, 'Fine Arts', 'Carefully crafting a mural, focusing on every detail.', 5),
(5, 'Pickleball', 'Smashing serves and firing quick volleys in fast-paced games.', 6),
(5, 'Rock Climbing', 'Scaling a rock wall methodically, choosing each handhold.', 7),
(5, 'Pottery', 'Shaping clay on the wheel, creating smooth, beautiful pottery.', 8);

-- Category 6: Food
INSERT INTO options (category_id, title, description, display_order) VALUES
(6, 'HK Style Milk Tea', 'Bubble Tea Buddy - A popular drink that brings everyone together.', 1),
(6, 'VLT Lemon Tea', 'Citrus Cheerleader - A refreshing lemon tea lifting spirits.', 2),
(6, 'HK French Toast', 'Toastmaster Champion - A delicious toast that wins brunch.', 3),
(6, 'Ovaltine', 'Choco-Smooth Operator - A comforting drink that warms the soul.', 4),
(6, 'Horlicks', 'Warm Hug in a Mug - A cozy drink perfect for relaxing.', 5),
(6, 'Sha Teh Beef Instant Noodle', 'Noodle Champion - A tasty bowl of beef noodles.', 6),
(6, 'Tam Zai Noodles', 'Noodle Ninja - A bowl of noodles with a fun twist.', 7),
(6, 'Pineapple Bun', 'Bun Fun Creator - A sweet bun that everyone loves.', 8),
(6, 'Mango Mochi', 'Dessert Diva - A chewy mochi tempting everyone at dessert time.', 9),
(6, 'Char Siu', 'BBQ Char Siu Artist - A char siu with a flair for creative cooking.', 10);

-- Category 7: Colour
INSERT INTO options (category_id, title, description, display_order) VALUES
(7, 'Lavender Lilac', 'Lavender Lilac Detective - A detective always found in lavender.', 1),
(7, 'Blush Pink', 'Blush Pink Matchmaker - A flamingo helping others find love.', 2),
(7, 'Sunshine Yellow', 'Sunshine Painter - A bright personality spreading joy.', 3),
(7, 'Electric Blue', 'Party Animal Blue - A vibrant color that livens up any room.', 4),
(7, 'Emerald Green', 'Nature''s Ambassador - A green leaf promoting environmental vibes.', 5),
(7, 'Fiery Red', 'Passionate Red Panda - A spirited character full of energy.', 6);

-- Category 8: Character
INSERT INTO options (category_id, title, description, display_order) VALUES
(8, 'Zootopia Rabbit', 'Optimistic Undercover Agent - A small, cheerful rabbit eager to prove size doesn''t matter.', 1),
(8, 'Marvel Superhero', 'Powerful Avenger - A brave hero ready to save the day with cool gadgets.', 2),
(8, 'Gossip Girl', 'Sassy Socialite - A sharp-tongued observer who knows everyone''s secrets.', 3),
(8, 'Disney Princess', 'Dreamy Romantic - A kind-hearted character wishing for adventures and true love.', 4),
(8, 'Hogwarts Wizard', 'Know-it-All Gryffindor - A smart and brave student excelling at magic.', 5),
(8, 'SpongeBob SquarePants', 'Eternal Optimist - A goofy character seeing the bright side of everything.', 6),
(8, 'Sherlock Holmes', 'Brilliant Detective - A clever sleuth solving mysteries with style.', 7),
(8, 'Kong (King Kong)', 'Gentle Giant - A misunderstood creature with a big heart.', 8),
(8, 'The Office''s Michael Scott', 'Awkward Boss - A well-meaning but often clueless manager.', 9),
(8, 'Game of Thrones Character', 'Ambitious Ruler - A cunning character always plotting the next move.', 10);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveals ENABLE ROW LEVEL SECURITY;

-- Users: Public read (for voting), Self update
CREATE POLICY "Public users are viewable" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Categories/Options: Public read
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Options are viewable by everyone" ON options FOR SELECT USING (true);

-- Votes: Public insert (anon), Owner read
CREATE POLICY "Anyone can insert votes" ON votes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view votes for their calendar" ON votes FOR SELECT USING (auth.uid() = calendar_owner_id);

-- Reveals: Self read/insert
CREATE POLICY "Users can manage own reveals" ON reveals FOR ALL USING (auth.uid() = user_id);