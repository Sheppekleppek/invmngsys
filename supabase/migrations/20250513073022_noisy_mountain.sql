/*
  # Add branch transfers functionality

  1. New Tables
    - `branch_transfers`
      - `id` (uuid, primary key)
      - `from_branch_id` (uuid, references branches)
      - `to_branch_id` (uuid, references branches)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `status` (enum: pending, approved, rejected, completed)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `branch_transfers` table
    - Add policies for branch managers to:
      - Create transfer requests from their branch
      - View transfers involving their branch
      - Update transfers to their branch
    - Add policies for main managers to manage all transfers
*/

-- Create transfer status enum
CREATE TYPE transfer_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- Create branch transfers table
CREATE TABLE IF NOT EXISTS branch_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  to_branch_id uuid REFERENCES branches(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  status transfer_status NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE branch_transfers ENABLE ROW LEVEL SECURITY;

-- Policies for branch managers
CREATE POLICY "Branch managers can create transfer requests from their branch"
  ON branch_transfers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.branch_id = from_branch_id
    )
  );

CREATE POLICY "Branch managers can view transfers involving their branch"
  ON branch_transfers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.branch_id = from_branch_id
        OR profiles.branch_id = to_branch_id
        OR profiles.role = 'main_manager'
      )
    )
  );

CREATE POLICY "Branch managers can update transfers to their branch"
  ON branch_transfers
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.branch_id = to_branch_id
        OR profiles.role = 'main_manager'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.branch_id = to_branch_id
        OR profiles.role = 'main_manager'
      )
    )
  );

-- Function to update inventory after transfer completion
CREATE OR REPLACE FUNCTION update_inventory_on_transfer_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Decrease inventory in source branch
    UPDATE branch_inventory
    SET quantity = quantity - NEW.quantity
    WHERE branch_id = NEW.from_branch_id
    AND product_id = NEW.product_id;

    -- Increase inventory in destination branch
    INSERT INTO branch_inventory (branch_id, product_id, quantity)
    VALUES (NEW.to_branch_id, NEW.product_id, NEW.quantity)
    ON CONFLICT (branch_id, product_id)
    DO UPDATE SET quantity = branch_inventory.quantity + NEW.quantity;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inventory updates
CREATE TRIGGER update_inventory_after_transfer
  AFTER UPDATE ON branch_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_transfer_complete();