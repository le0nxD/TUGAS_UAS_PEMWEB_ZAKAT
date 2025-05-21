import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { Database } from '../../lib/database.types';
import supabase from '../../lib/supabase';
import { Plus, Edit, Trash, Info, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import { useReactToPrint } from 'react-to-print';
import PrintableTable from '../../components/ui/PrintableTable';

type MustahikLainnya = Database['public']['Tables']['mustahik_lainnya']['Row'];
type MustahikLainnyaInsert = Database['public']['Tables']['mustahik_lainnya']['Insert'];
// Asumsi KategoriMustahik memiliki 'jumlah_hak' (number) dan mungkin 'jumlah_hak_type' ('beras' | 'uang')
type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'] & { jumlah_hak_type?: 'beras' | 'uang' };


const MustahikLainnyaPage: React.FC = () => {
  const [mustahikList, setMustahikList] = useState<MustahikLainnya[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMustahik, setSelectedMustahik] = useState<MustahikLainnya | null>(null);
  const [hakType, setHakType] = useState<'beras' | 'uang'>('beras'); // Default jenis hak
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MustahikLainnyaInsert>({
    defaultValues: {
      nama: '',
      kategori: '',
      hak: 0, // Default value untuk hak
    },
  });

  const formKategori = watch('kategori'); // Mengawasi field 'kategori' dari form
  // const formHak = watch('hak'); // Bisa digunakan jika perlu memantau nilai hak secara langsung

  const exchangeRate = 15000; // Nilai tukar beras ke rupiah (1 kg = Rp 15.000)

  useEffect(() => {
    fetchData();
  }, []);

  // Efek untuk mengisi form saat mode edit atau view
  useEffect(() => {
    if (selectedMustahik && (openModal === 'edit' || openModal === 'view')) {
      reset({ // Menggunakan reset untuk mengisi semua field form
        nama: selectedMustahik.nama,
        kategori: selectedMustahik.kategori,
        hak: selectedMustahik.hak, // Ini adalah nilai hak yang sudah tersimpan
      });

      // Menentukan dan mengatur hakType berdasarkan data yang dimuat
      const kategoriInfo = kategoriList.find(k => k.nama_kategori === selectedMustahik.kategori);
      let determinedHakType: 'beras' | 'uang' = 'beras'; // Default

      if (kategoriInfo && typeof selectedMustahik.hak === 'number') {
        const hakKategoriAsBeras = kategoriInfo.jumlah_hak;
        const hakKategoriAsUang = kategoriInfo.jumlah_hak * exchangeRate;

        // Coba tebak hakType berdasarkan nilai hak yang tersimpan
        if (selectedMustahik.hak === hakKategoriAsUang && hakKategoriAsBeras !== hakKategoriAsUang) {
          determinedHakType = 'uang';
        } else if (selectedMustahik.hak === hakKategoriAsBeras) {
          determinedHakType = 'beras';
        } else {
          // Fallback jika ada override manual atau kategori memang dalam uang
          // Jika ada 'jumlah_hak_type' di kategoriList, itu akan lebih akurat
          if (kategoriInfo.jumlah_hak_type === 'uang') {
            determinedHakType = 'uang';
          } else if (kategoriInfo.jumlah_hak_type === 'beras') {
            determinedHakType = 'beras';
          } else if (selectedMustahik.hak > hakKategoriAsBeras && selectedMustahik.hak >= 1000) { // Ambang batas sederhana untuk uang
            determinedHakType = 'uang';
          }
        }
      } else if (typeof selectedMustahik.hak === 'number' && selectedMustahik.hak >= 1000) {
        // Jika tidak ada info kategori, tebak dari besaran hak
        determinedHakType = 'uang';
      }
      setHakType(determinedHakType);
    }
  }, [selectedMustahik, openModal, reset, kategoriList, exchangeRate]);

  // Efek untuk menghitung ulang 'hak' secara otomatis ketika 'kategori' form atau 'hakType' state berubah
  useEffect(() => {
    if (openModal === 'view') return; // Tidak perlu kalkulasi di mode view

    if (formKategori && kategoriList.length > 0) {
      const kategoriTerpilih = kategoriList.find(k => k.nama_kategori === formKategori);
      if (kategoriTerpilih) {
        let calculatedHak;
        if (hakType === 'beras') {
          calculatedHak = kategoriTerpilih.jumlah_hak;
        } else { // hakType === 'uang'
          calculatedHak = kategoriTerpilih.jumlah_hak * exchangeRate;
        }
        setValue('hak', calculatedHak, { shouldDirty: true, shouldValidate: true });
      } else {
        // Kategori dipilih tapi tidak ditemukan (seharusnya tidak terjadi jika data konsisten)
        // setValue('hak', 0, { shouldDirty: true, shouldValidate: true }); // Atau biarkan
      }
    } else if (!formKategori && (openModal === 'add' || openModal === 'edit')) {
      // Jika kategori belum dipilih atau dikosongkan, set hak ke 0 atau nilai default
      setValue('hak', 0, { shouldDirty: true, shouldValidate: true });
    }
  }, [formKategori, hakType, kategoriList, setValue, exchangeRate, openModal]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Data_Mustahik_Lainnya_${new Date().toLocaleDateString('id-ID')}`,
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: mustahikData, error: mustahikError } = await supabase
        .from('mustahik_lainnya')
        .select('*')
        .order('nama', { ascending: true });
      if (mustahikError) throw mustahikError;
      setMustahikList(mustahikData || []);

      const { data: kategoriData, error: kategoriError } = await supabase
        .from('kategori_mustahik')
        .select('*')
        .order('nama_kategori', { ascending: true });
      if (kategoriError) throw kategoriError;
      setKategoriList(kategoriData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal mengambil data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (
    type: 'add' | 'edit' | 'view' | 'delete',
    mustahik: MustahikLainnya | null = null
  ) => {
    setSelectedMustahik(mustahik);
    setOpenModal(type);
    if (type === 'add') {
      reset({ // Reset form ke nilai default
        nama: '',
        kategori: '',
        hak: 0,
      });
      setHakType('beras'); // Set default jenis hak untuk entri baru
    }
    // Untuk 'edit', useEffect [selectedMustahik] akan mengisi form
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedMustahik(null);
    reset(); // Reset form ke nilai default saat modal ditutup
  };
  
  const formatHakForDisplay = (value: number | string | null | undefined, kategoriNama?: string | null): string => {
    if (value === null || value === undefined || value === '') return '-';
    const numericValue = Number(value);
    if (isNaN(numericValue)) return String(value); // Jika tidak bisa jadi angka, kembalikan apa adanya

    let isUang = false;
    const kategoriDef = kategoriList.find(k => k.nama_kategori === kategoriNama);

    if (kategoriDef) {
        // Idealnya, KategoriMustahik punya properti `jumlah_hak_type: 'beras' | 'uang'`
        if (kategoriDef.jumlah_hak_type === 'uang') {
            isUang = true;
        } else if (kategoriDef.jumlah_hak_type === 'beras') {
            isUang = false;
        } else { 
            // Fallback jika tidak ada jumlah_hak_type: tebak berdasarkan konversi atau besaran
            if (numericValue === kategoriDef.jumlah_hak * exchangeRate && numericValue !== kategoriDef.jumlah_hak) {
                isUang = true; // Cocok dengan konversi uang dari hak beras asli
            } else if (numericValue !== kategoriDef.jumlah_hak && numericValue >= 1000) {
                isUang = true; // Nilai berbeda dari hak beras & cukup besar
            } else if (numericValue === kategoriDef.jumlah_hak) {
                isUang = false; // Cocok dengan hak beras asli
            } else {
                 // Default tebakan jika masih ambigu (misal nilai kecil tapi bukan hak beras asli)
                isUang = numericValue >= 1000;
            }
        }
    } else {
        // Kategori tidak ditemukan, tebak murni dari nilai
        isUang = numericValue >= 1000;
    }

    if (isUang) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0,
      }).format(numericValue);
    } else {
      return `${Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1)} kg`;
    }
  };


  const onSubmit = async (data: MustahikLainnyaInsert) => {
    try {
      const hakNumeric = parseFloat(String(data.hak));
      if (isNaN(hakNumeric)) {
        toast.error('Nilai hak tidak valid.');
        return;
      }

      const submitData = { ...data, hak: hakNumeric };

      if (openModal === 'add') {
        const { error } = await supabase.from('mustahik_lainnya').insert([submitData]);
        if (error) throw error;
        toast.success('Mustahik lainnya berhasil ditambahkan');
      } else if (openModal === 'edit' && selectedMustahik) {
        const { error } = await supabase
          .from('mustahik_lainnya')
          .update(submitData)
          .eq('id_mustahiklainnnya', selectedMustahik.id_mustahiklainnnya);
        if (error) throw error;
        toast.success('Mustahik lainnya berhasil diperbarui');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving mustahik lainnya:', error);
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedMustahik) return;
    try {
      const { error } = await supabase
        .from('mustahik_lainnya')
        .delete()
        .eq('id_mustahiklainnnya', selectedMustahik.id_mustahiklainnnya);
      if (error) throw error;
      toast.success('Mustahik lainnya berhasil dihapus');
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting mustahik lainnya:', error);
      toast.error('Gagal menghapus mustahik lainnya');
    }
  };

  const printColumns = [
    { header: 'Nama', accessor: 'nama' },
    { header: 'Kategori', accessor: 'kategori' },
    { header: 'Hak', accessor: 'hak', cell: (row: MustahikLainnya) => formatHakForDisplay(row.hak, row.kategori) },
  ];

  const columns = [
    { header: 'Nama', accessor: 'nama', sortable: true },
    { header: 'Kategori', accessor: 'kategori', sortable: true },
    { header: 'Hak', accessor: 'hak', sortable: true, cell: (row: MustahikLainnya) => formatHakForDisplay(row.hak, row.kategori) },
    {
      header: 'Actions',
      accessor: (row: MustahikLainnya) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" icon={<Info size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('view', row); }} />
          <Button variant="ghost" size="sm" icon={<Edit size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', row); }} />
          <Button variant="ghost" size="sm" icon={<Trash size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', row); }} />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Distribusi Zakat Fitrah Lainnya</h1>
        <div className="flex gap-2">
          <Button variant="outline" icon={<FileDown size={16} />} onClick={handlePrint} disabled={mustahikList.length === 0}>
            Ekspor PDF
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal('add')}>
            Tambah Mustahik
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mustahikList}
            keyField="id_mustahiklainnnya"
            isLoading={isLoading}
            emptyMessage="Tidak ada data mustahik lainnya."
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      <div className="hidden"><div ref={printRef}><PrintableTable title="Data Mustahik Lainnya" columns={printColumns} data={mustahikList} keyField="id_mustahiklainnnya" /></div></div>

      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Mustahik Lainnya' : 'Edit Mustahik Lainnya'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama"
            placeholder="Masukkan nama mustahik"
            error={errors.nama?.message}
            disabled={openModal === 'view'}
            {...register('nama', { required: 'Nama mustahik harus diisi' })}
          />

          <div>
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              id="kategori"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={openModal === 'view'}
              {...register('kategori', { required: 'Kategori mustahik harus dipilih' })}
            >
              <option value="">Pilih Kategori</option>
              {kategoriList.map((kat) => (
                <option key={kat.id_kategori} value={kat.nama_kategori}>
                  {kat.nama_kategori}
                </option>
              ))}
            </select>
            {errors.kategori && <p className="mt-1 text-sm text-red-600">{errors.kategori.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Hak</label>
            <div className="flex gap-x-4">
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-primary-600" checked={hakType === 'beras'} onChange={() => setHakType('beras')} disabled={openModal === 'view'} />
                <span className="ml-2">Beras</span>
              </label>
              <label className="inline-flex items-center">
                <input type="radio" className="form-radio text-primary-600" checked={hakType === 'uang'} onChange={() => setHakType('uang')} disabled={openModal === 'view'} />
                <span className="ml-2">Uang</span>
              </label>
            </div>
          </div>

          <Input
            label={hakType === 'beras' ? 'Hak (kg)' : 'Hak (Rp)'}
            type="number"
            step={hakType === 'beras' ? '0.1' : '1'}
            placeholder={hakType === 'beras' ? 'Jumlah beras (kg)' : 'Jumlah uang (Rp)'}
            error={errors.hak?.message}
            disabled={openModal === 'view'}
            {...register('hak', {
              required: 'Hak mustahik harus diisi',
              valueAsNumber: true,
              min: { value: 0, message: 'Hak tidak boleh negatif' },
            })}
          />
          { (formKategori && hakType ) &&
            <p className="text-xs text-gray-500 -mt-2">
              Otomatis: {
                (() => {
                  const kat = kategoriList.find(k => k.nama_kategori === formKategori);
                  if (!kat) return '-';
                  return hakType === 'beras' ? `${kat.jumlah_hak} kg` : formatHakForDisplay(kat.jumlah_hak * exchangeRate, formKategori);
                })()
              }
            </p>
          }


          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" type="button" onClick={handleCloseModal}>Batal</Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {openModal === 'add' ? 'Simpan' : 'Perbarui'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={openModal === 'view'} onClose={handleCloseModal} title="Detail Mustahik Lainnya">
        {selectedMustahik && (
          <div className="space-y-3">
            <div><h3 className="text-sm font-medium text-gray-500">Nama</h3><p className="mt-1 text-base">{selectedMustahik.nama}</p></div>
            <div><h3 className="text-sm font-medium text-gray-500">Kategori</h3><p className="mt-1 text-base">{selectedMustahik.kategori}</p></div>
            <div><h3 className="text-sm font-medium text-gray-500">Hak Diterima</h3><p className="mt-1 text-base">{formatHakForDisplay(selectedMustahik.hak, selectedMustahik.kategori)}</p></div>
            <div className="flex justify-end space-x-2 pt-3">
              <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
              <Button variant="primary" onClick={() => { handleOpenModal('edit', selectedMustahik); }}>Edit</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={openModal === 'delete'} onClose={handleCloseModal} title="Hapus Mustahik Lainnya">
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus data mustahik <span className="font-medium">{selectedMustahik?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
          <Button variant="danger" onClick={handleDelete} disabled={isLoading}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
};

export default MustahikLainnyaPage;