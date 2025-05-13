/*
  # Add warehouse inventory management
  
  1. New Tables
    - `warehouse_inventory`
      - `id` (uuid, primary key)
      - `store_id` (uuid, references stores)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `min_stock_level` (integer)
      - timestamps
  
  2. Changes
    - Add trigger to maintain warehouse inventory sync with branch transfers
    - Add policies for warehouse inventory access
*/

-- Create warehouse inventory table
CREATE TABLE warehouse_inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  min_stock_level integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(store_id, product_id)
);

-- Enable RLS
ALTER TABLE warehouse_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Main managers can manage warehouse inventory"
  ON warehouse_inventory
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'main_manager'
      AND profiles.store_id = warehouse_inventory.store_id
    )
  );

CREATE POLICY "Branch managers can view warehouse inventory"
  ON warehouse_inventory
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.store_id = warehouse_inventory.store_id
    )
  );

-- Create function to update warehouse inventory on transfer
CREATE OR REPLACE FUNCTION update_warehouse_inventory_on_transfer()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Deduct from warehouse inventory
    UPDATE warehouse_inventory
    SET quantity = quantity - NEW.quantity
    WHERE store_id = (
      SELECT store_id FROM branches WHERE id = NEW.from_branch_id
    )
    AND product_id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_warehouse_inventory_after_transfer
  AFTER UPDATE ON branch_transfers
  FOR EACH ROW
  EXECUTE FUNCTION update_warehouse_inventory_on_transfer();

-- Create indexes
CREATE INDEX idx_warehouse_inventory_store_id ON warehouse_inventory(store_id);
CREATE INDEX idx_warehouse_inventory_product_id ON warehouse_inventory(product_id);