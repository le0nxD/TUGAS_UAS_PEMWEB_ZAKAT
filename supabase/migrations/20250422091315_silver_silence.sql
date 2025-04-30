/*
  # Initial Schema for Zakat Management System

  1. New Tables
     - `muzakki` - Stores information about zakat givers
     - `kategori_mustahik` - Categories of zakat recipients
     - `bayarzakat` - Records of zakat payments
     - `mustahik_warga` - Resident recipients
     - `mustahik_lainnya` - Other recipients
  
  2. Security
     - Enable RLS on all tables
     - Add policies for authenticated users to manage data
*/

-- First create all tables before any modification operations
-- This helps prevent deadlocks by avoiding interleaved DDL operations

-- Create muzakki table
CREATE TABLE IF NOT EXISTS muzakki (
  id_muzakki UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_muzakki TEXT NOT NULL,
  jumlah_tanggungan INTEGER NOT NULL DEFAULT 0,
  keterangan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create kategori_mustahik table
CREATE TABLE IF NOT EXISTS kategori_mustahik (
  id_kategori UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kategori TEXT NOT NULL,
  jumlah_hak NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create bayarzakat table
CREATE TABLE IF NOT EXISTS bayarzakat (
  id_zakat UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_KK TEXT NOT NULL,
  jumlah_tanggungan INTEGER NOT NULL,
  jenis_bayar TEXT NOT NULL CHECK (jenis_bayar IN ('beras', 'uang')),
  jumlah_tanggunganyang_dibayar INTEGER NOT NULL,
  bayar_beras NUMERIC,
  bayar_uang NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mustahik_warga table
CREATE TABLE IF NOT EXISTS mustahik_warga (
  id_mustahikwarga UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  hak NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create mustahik_lainnya table
CREATE TABLE IF NOT EXISTS mustahik_lainnya (
  id_mustahiklainnnya UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama TEXT NOT NULL,
  kategori TEXT NOT NULL,
  hak NUMERIC NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- After all tables are created, enable RLS on them
-- Always enable RLS in a consistent order to prevent deadlocks
DO $$
BEGIN
  -- Enable Row Level Security on all tables in a transaction
  ALTER TABLE muzakki ENABLE ROW LEVEL SECURITY;
  ALTER TABLE kategori_mustahik ENABLE ROW LEVEL SECURITY;
  ALTER TABLE bayarzakat ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mustahik_warga ENABLE ROW LEVEL SECURITY;
  ALTER TABLE mustahik_lainnya ENABLE ROW LEVEL SECURITY;
END $$;

-- Create policies for muzakki table
CREATE POLICY "Allow authenticated users to read muzakki"
  ON muzakki FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert muzakki"
  ON muzakki FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update muzakki"
  ON muzakki FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete muzakki"
  ON muzakki FOR DELETE TO authenticated USING (true);

-- Create policies for kategori_mustahik table
CREATE POLICY "Allow authenticated users to read kategori_mustahik"
  ON kategori_mustahik FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert kategori_mustahik"
  ON kategori_mustahik FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update kategori_mustahik"
  ON kategori_mustahik FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete kategori_mustahik"
  ON kategori_mustahik FOR DELETE TO authenticated USING (true);

-- Create policies for bayarzakat table
CREATE POLICY "Allow authenticated users to read bayarzakat"
  ON bayarzakat FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert bayarzakat"
  ON bayarzakat FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update bayarzakat"
  ON bayarzakat FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete bayarzakat"
  ON bayarzakat FOR DELETE TO authenticated USING (true);

-- Create policies for mustahik_warga table
CREATE POLICY "Allow authenticated users to read mustahik_warga"
  ON mustahik_warga FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert mustahik_warga"
  ON mustahik_warga FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update mustahik_warga"
  ON mustahik_warga FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete mustahik_warga"
  ON mustahik_warga FOR DELETE TO authenticated USING (true);

-- Create policies for mustahik_lainnya table
CREATE POLICY "Allow authenticated users to read mustahik_lainnya"
  ON mustahik_lainnya FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert mustahik_lainnya"
  ON mustahik_lainnya FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update mustahik_lainnya"
  ON mustahik_lainnya FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to delete mustahik_lainnya"
  ON mustahik_lainnya FOR DELETE TO authenticated USING (true);