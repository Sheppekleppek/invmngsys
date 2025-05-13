/*
  # Remove price field from products table
  
  1. Changes
    - Remove price column from products table
*/

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products DROP COLUMN price;
  END IF;
END $$;