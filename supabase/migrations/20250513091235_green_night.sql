/*
  # Multi-tenant Platform Setup

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `logo_url` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `store_admins`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `user_id` (uuid, references auth.users)
      - `full_name` (text)
      - `phone` (text)
      - `username` (text, unique)
      - `is_verified` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `admin_messages`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `from_admin_id` (uuid, references store_admins)
      - `to_branch_id` (uuid, references branches)
      - `message` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for proper access control
    - Add foreign key constraints

  3. Changes
    - Add store_id to existing tables
    - Update existing RLS policies
*/

-- Create stores table
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create store_admins table
CREATE TABLE store_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  username text UNIQUE NOT NULL,
  is_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, user_id)
);

-- Create admin_messages table
CREATE TABLE admin_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  from_admin_id uuid REFERENCES store_admins(id) ON DELETE CASCADE,
  to_branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add store_id to existing tables
ALTER TABLE branches ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE products ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN store_id uuid REFERENCES stores(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_messages ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Anyone can view stores" ON stores
  FOR SELECT USING (true);

CREATE POLICY "Only store admin can update their store" ON stores
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM store_admins
      WHERE store_admins.store_id = stores.id
      AND store_admins.user_id = auth.uid()
    )
  );

-- Store admins policies
CREATE POLICY "Store admins can view their own record" ON store_admins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Store admins can update their own record" ON store_admins
  FOR UPDATE USING (user_id = auth.uid());

-- Messages policies
CREATE POLICY "Main admin can send messages" ON admin_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM store_admins
      WHERE store_admins.id = from_admin_id
      AND store_admins.user_id = auth.uid()
    )
  );

CREATE POLICY "Branch managers can view messages for their branch" ON admin_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.branch_id = admin_messages.to_branch_id
      AND profiles.id = auth.uid()
    )
  );

-- Update existing table policies to include store_id checks
CREATE POLICY "Users can only access their store's data" ON branches
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.store_id = branches.store_id
      AND profiles.id = auth.uid()
    )
  );

CREATE POLICY "Users can only access their store's products" ON products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.store_id = products.store_id
      AND profiles.id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX idx_store_admins_store_id ON store_admins(store_id);
CREATE INDEX idx_store_admins_user_id ON store_admins(user_id);
CREATE INDEX idx_branches_store_id ON branches(store_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_profiles_store_id ON profiles(store_id);