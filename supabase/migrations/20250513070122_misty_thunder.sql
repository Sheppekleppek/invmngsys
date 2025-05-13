/*
  # Initial Schema Setup for Sheppek_Leppek IMS

  1. New Tables
    - `branches` - Store branch information
    - `products` - Global product catalog
    - `branch_inventory` - Per-branch inventory tracking
    - `sales` - Sales records per branch
    - `profiles` - Extended user profile information

  2. Security
    - Enable RLS on all tables
    - Add policies for Main Manager and Branch Manager roles
    - Set up appropriate access controls
*/

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('main_manager', 'branch_manager');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'branch_manager',
  full_name text,
  branch_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create branches table
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  name_ar text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create branch_inventory table
CREATE TABLE IF NOT EXISTS branch_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(branch_id, product_id)
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE branch_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Main manager can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (role = 'main_manager');

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Branches policies
CREATE POLICY "Anyone can view branches"
  ON branches FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Main manager can manage branches"
  ON branches
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'main_manager'
  ));

-- Products policies
CREATE POLICY "Anyone can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Main manager can manage products"
  ON products
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'main_manager'
  ));

-- Branch inventory policies
CREATE POLICY "Main manager can manage all inventory"
  ON branch_inventory
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'main_manager'
  ));

CREATE POLICY "Branch managers can view their inventory"
  ON branch_inventory FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND branch_id = branch_inventory.branch_id
  ));

-- Sales policies
CREATE POLICY "Branch managers can add sales for their branch"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND branch_id = sales.branch_id
  ));

CREATE POLICY "Branch managers can view their sales"
  ON sales FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND branch_id = sales.branch_id
  ));

-- Create function to update inventory on sale
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE branch_inventory
  SET quantity = quantity - NEW.quantity
  WHERE branch_id = NEW.branch_id
  AND product_id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update inventory when sale is made
CREATE TRIGGER update_inventory_after_sale
  AFTER INSERT ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_sale();