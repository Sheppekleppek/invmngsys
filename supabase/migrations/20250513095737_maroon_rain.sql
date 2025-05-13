/*
  # Update transfer triggers and functions

  1. Changes
    - Add warehouse inventory check before transfer
    - Update warehouse inventory on transfer completion
    - Sync branch inventory with warehouse

  2. Security
    - Maintain existing RLS policies
    - Add validation for inventory quantities
*/

-- Function to check warehouse inventory before transfer
CREATE OR REPLACE FUNCTION check_warehouse_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's enough inventory in the warehouse
  IF NOT EXISTS (
    SELECT 1 FROM warehouse_inventory
    WHERE store_id = (SELECT store_id FROM branches WHERE id = NEW.from_branch_id)
    AND product_id = NEW.product_id
    AND quantity >= NEW.quantity
  ) THEN
    RAISE EXCEPTION 'Insufficient warehouse inventory';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventories after transfer completion
CREATE OR REPLACE FUNCTION update_inventory_on_transfer_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Update source branch inventory
    UPDATE branch_inventory
    SET quantity = quantity - NEW.quantity
    WHERE branch_id = NEW.from_branch_id
    AND product_id = NEW.product_id;

    -- Update destination branch inventory
    INSERT INTO branch_inventory (branch_id, product_id, quantity)
    VALUES (NEW.to_branch_id, NEW.product_id, NEW.quantity)
    ON CONFLICT (branch_id, product_id)
    DO UPDATE SET quantity = branch_inventory.quantity + NEW.quantity;

    -- Update warehouse inventory
    UPDATE warehouse_inventory
    SET quantity = quantity - NEW.quantity
    WHERE store_id = (SELECT store_id FROM branches WHERE id = NEW.from_branch_id)
    AND product_id = NEW.product_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for warehouse inventory check
CREATE TRIGGER check_warehouse_inventory_before_transfer
  BEFORE INSERT ON branch_transfers
  FOR EACH ROW
  EXECUTE FUNCTION check_warehouse_inventory();