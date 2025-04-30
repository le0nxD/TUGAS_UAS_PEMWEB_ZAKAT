export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      muzakki: {
        Row: {
          id_muzakki: string
          nama_muzakki: string
          jumlah_tanggungan: number
          keterangan: string | null
          created_at: string
        }
        Insert: {
          id_muzakki?: string
          nama_muzakki: string
          jumlah_tanggungan: number
          keterangan?: string | null
          created_at?: string
        }
        Update: {
          id_muzakki?: string
          nama_muzakki?: string
          jumlah_tanggungan?: number
          keterangan?: string | null
          created_at?: string
        }
      }
      kategori_mustahik: {
        Row: {
          id_kategori: string
          nama_kategori: string
          jumlah_hak: number
          created_at: string
        }
        Insert: {
          id_kategori?: string
          nama_kategori: string
          jumlah_hak: number
          created_at?: string
        }
        Update: {
          id_kategori?: string
          nama_kategori?: string
          jumlah_hak?: number
          created_at?: string
        }
      }
      bayarzakat: {
        Row: {
          id_zakat: string
          nama_kk: string
          jumlah_tanggungan: number
          jenis_bayar: string
          jumlah_tanggunganyang_dibayar: number
          bayar_beras: number | null
          bayar_uang: number | null
          created_at: string
        }
        Insert: {
          id_zakat?: string
          nama_kk: string
          jumlah_tanggungan: number
          jenis_bayar: string
          jumlah_tanggunganyang_dibayar: number
          bayar_beras?: number | null
          bayar_uang?: number | null
          created_at?: string
        }
        Update: {
          id_zakat?: string
          nama_kk?: string
          jumlah_tanggungan?: number
          jenis_bayar?: string
          jumlah_tanggunganyang_dibayar?: number
          bayar_beras?: number | null
          bayar_uang?: number | null
          created_at?: string
        }
      }
      mustahik_warga: {
        Row: {
          id_mustahikwarga: string
          nama: string
          kategori: string
          hak: number
          created_at: string
        }
        Insert: {
          id_mustahikwarga?: string
          nama: string
          kategori: string
          hak: number
          created_at?: string
        }
        Update: {
          id_mustahikwarga?: string
          nama?: string
          kategori?: string
          hak?: number
          created_at?: string
        }
      }
      mustahik_lainnya: {
        Row: {
          id_mustahiklainnnya: string
          nama: string
          kategori: string
          hak: number
          created_at: string
        }
        Insert: {
          id_mustahiklainnnya?: string
          nama: string
          kategori: string
          hak: number
          created_at?: string
        }
        Update: {
          id_mustahiklainnnya?: string
          nama?: string
          kategori?: string
          hak?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}