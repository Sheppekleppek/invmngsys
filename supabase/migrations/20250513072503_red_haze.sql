/*
  # Add price field to products table

  1. Changes
    - Add `price` column to `products` table
      - Decimal type to store currency amounts
      - Not nullable with default value of 0
      - Check constraint to ensure price is not negative

  2. Notes
    - Uses decimal(10,2) for precise currency calculations
    - Adds check constraint for data validation
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'price'
  ) THEN
    ALTER TABLE products 
    ADD COLUMN price decimal(10,2) NOT NULL DEFAULT 0.00;

    ALTER TABLE products 
    ADD CONSTRAINT products_price_check CHECK (price >= 0);
  END IF;
END $$;