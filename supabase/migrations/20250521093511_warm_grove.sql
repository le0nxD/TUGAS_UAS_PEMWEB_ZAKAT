/*
  # Add keterangan field to kategori_mustahik table

  1. Changes
    - Add nullable keterangan column to kategori_mustahik table
*/

ALTER TABLE kategori_mustahik
ADD COLUMN IF NOT EXISTS keterangan TEXT NULL;