/*
  # Create Stock Management System

  1. New Tables
    - `stock_groups`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `synchronizable` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `stocks`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `group_id` (uuid, references stock_groups)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `stock_produit`
      - `id` (uuid, primary key)
      - `produit_id` (uuid, references products)
      - `stock_id` (uuid, references stocks)
      - `quantite` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes to products table
    - Add stock_total column
    - Add trigger for automatic stock calculation

  3. Security
    - Enable RLS
    - Add policies for authenticated users
*/

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "stock_groups_crud_policy" ON stock_groups;
DROP POLICY IF EXISTS "stocks_crud_policy" ON stocks;
DROP POLICY IF EXISTS "stock_produit_crud_policy" ON stock_produit;

-- Create stock_groups table
CREATE TABLE IF NOT EXISTS stock_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  synchronizable boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stocks table
CREATE TABLE IF NOT EXISTS stocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  group_id uuid REFERENCES stock_groups(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create stock_produit table
CREATE TABLE IF NOT EXISTS stock_produit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  produit_id uuid REFERENCES products(id) ON DELETE CASCADE,
  stock_id uuid REFERENCES stocks(id) ON DELETE CASCADE,
  quantite integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(produit_id, stock_id)
);

-- Add stock_total to products
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS stock_total integer DEFAULT 0;

-- Create function to update stock_total
CREATE OR REPLACE FUNCTION update_stock_total() 
RETURNS TRIGGER AS $$ 
BEGIN
  -- Calculate new total stock for the product
  UPDATE products 
  SET stock_total = (
    SELECT COALESCE(SUM(quantite), 0) 
    FROM stock_produit 
    WHERE produit_id = COALESCE(NEW.produit_id, OLD.produit_id)
  )
  WHERE id = COALESCE(NEW.produit_id, OLD.produit_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for stock_total updates
DROP TRIGGER IF EXISTS stock_total_update ON stock_produit;
CREATE TRIGGER stock_total_update
  AFTER INSERT OR UPDATE OR DELETE ON stock_produit
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_total();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_produit_produit_id ON stock_produit(produit_id);
CREATE INDEX IF NOT EXISTS idx_stock_produit_stock_id ON stock_produit(stock_id);

-- Enable RLS
ALTER TABLE stock_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_produit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "stock_groups_crud_policy" ON stock_groups;
  DROP POLICY IF EXISTS "stocks_crud_policy" ON stocks;
  DROP POLICY IF EXISTS "stock_produit_crud_policy" ON stock_produit;
  
  -- Create new policies
  CREATE POLICY "stock_groups_access_policy"
    ON stock_groups
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "stocks_access_policy"
    ON stocks
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

  CREATE POLICY "stock_produit_access_policy"
    ON stock_produit
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_stock_groups_updated_at
  BEFORE UPDATE ON stock_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON stocks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_produit_updated_at
  BEFORE UPDATE ON stock_produit
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to enforce uppercase names
CREATE OR REPLACE FUNCTION enforce_uppercase_stock_groups()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name := UPPER(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enforce_uppercase_stocks()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name := UPPER(NEW.name);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create uppercase triggers
CREATE TRIGGER stock_groups_uppercase_trigger
    BEFORE INSERT OR UPDATE ON stock_groups
    FOR EACH ROW
    EXECUTE FUNCTION enforce_uppercase_stock_groups();

CREATE TRIGGER stocks_uppercase_trigger
    BEFORE INSERT OR UPDATE ON stocks
    FOR EACH ROW
    EXECUTE FUNCTION enforce_uppercase_stocks();

-- Insert initial stock groups
INSERT INTO stock_groups (name, synchronizable) VALUES
  ('INTERNET', true),
  ('SAV', false),
  ('À RÉPARER', false)
ON CONFLICT (name) DO NOTHING;

-- Insert initial stocks
DO $$
DECLARE
  internet_id uuid;
  sav_id uuid;
  repair_id uuid;
BEGIN
  SELECT id INTO internet_id FROM stock_groups WHERE name = 'INTERNET';
  SELECT id INTO sav_id FROM stock_groups WHERE name = 'SAV';
  SELECT id INTO repair_id FROM stock_groups WHERE name = 'À RÉPARER';

  INSERT INTO stocks (name, group_id) VALUES
    ('BACK MARKET', internet_id),
    ('EBAY', internet_id),
    ('SAV UA', sav_id),
    ('À RÉPARER TOULOUSE', repair_id)
  ON CONFLICT (name) DO NOTHING;
END $$;