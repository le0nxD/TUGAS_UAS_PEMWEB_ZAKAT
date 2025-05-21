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

type MustahikWarga = Database['public']['Tables']['mustahik_warga']['Row'];
type MustahikWargaInsert = Database['public']['Tables']['mustahik_warga']['Insert'];
// Menyesuaikan KategoriMustahik agar bisa memiliki 'jumlah_hak_type' untuk logika yang lebih baik
type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'] & { jumlah_hak_type?: 'beras' | 'uang' };

const MustahikWargaPage: React.FC = () => {
  const [mustahikList, setMustahikList] = useState<MustahikWarga[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMustahik, setSelectedMustahik] = useState<MustahikWarga | null>(null);
  const [hakType, setHakType] = useState<'beras' | 'uang'>('beras'); // Default jenis hak
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MustahikWargaInsert>({
    defaultValues: { // Menambahkan default values
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
        // Logika ini mengasumsikan bahwa jika nilai hak cocok dengan konversi uang DAN berbeda dari nilai berasnya, itu adalah uang.
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
          // Heuristik tambahan: jika nilai hak cukup besar (misal >= 1000) dan tidak cocok dengan nilai beras, anggap uang
          } else if (selectedMustahik.hak > hakKategoriAsBeras && selectedMustahik.hak >= 1000) {
            determinedHakType = 'uang';
          }
          // Jika masih ambigu, biarkan default (beras) atau sesuaikan dengan kebutuhan
        }
      } else if (typeof selectedMustahik.hak === 'number' && selectedMustahik.hak >= 1000) {
        // Jika tidak ada info kategori, tebak dari besaran hak (ambang batas sederhana untuk uang)
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
        // Parameter ketiga { shouldDirty: true, shouldValidate: true } penting agar form dianggap "dirty"
        // dan validasi (jika ada) dijalankan setelah nilai diubah secara programatik.
        setValue('hak', calculatedHak, { shouldDirty: true, shouldValidate: true });
      } else {
        // setValue('hak', 0, { shouldDirty: true, shouldValidate: true });
      }
    } else if (!formKategori && (openModal === 'add' || openModal === 'edit')) {
      // Jika kategori belum dipilih atau dikosongkan, set hak ke 0 atau nilai default
      setValue('hak', 0, { shouldDirty: true, shouldValidate: true });
    }
  }, [formKategori, hakType, kategoriList, setValue, exchangeRate, openModal]);


  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Data_Mustahik_Warga_${new Date().toLocaleDateString('id-ID')}`,
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch mustahik warga data
      const { data: mustahikData, error: mustahikError } = await supabase
        .from('mustahik_warga')
        .select('*')
        .order('nama', { ascending: true });

      if (mustahikError) throw mustahikError;
      setMustahikList(mustahikData || []);

      // Fetch kategori mustahik data
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
    mustahik: MustahikWarga | null = null
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
    if (isNaN(numericValue)) return String(value);

    let isUang = false;
    const kategoriDef = kategoriList.find(k => k.nama_kategori === kategoriNama);

    if (kategoriDef) {
        if (kategoriDef.jumlah_hak_type === 'uang') {
            isUang = true;
        } else if (kategoriDef.jumlah_hak_type === 'beras') {
            isUang = false;
        } else {
            const hakKategoriAsBeras = kategoriDef.jumlah_hak;
            const hakKategoriAsUang = kategoriDef.jumlah_hak * exchangeRate;
            // Jika nilai sama dengan konversi uang dan BEDA dengan nilai beras asli, maka itu uang
            if (numericValue === hakKategoriAsUang && numericValue !== hakKategoriAsBeras) {
                isUang = true;
            // Jika nilai sama dengan nilai beras asli
            } else if (numericValue === hakKategoriAsBeras) {
                isUang = false;
            // Fallback: Jika nilai berbeda dari hak beras asli DAN cukup besar (>=1000), anggap uang
            } else if (numericValue !== hakKategoriAsBeras && numericValue >= 1000) {
                isUang = true;
            } else {
                // Default tebakan jika masih ambigu (misal nilai kecil tapi bukan hak beras asli)
                isUang = numericValue >= 1000; // Atau `false` jika ingin default ke beras
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
      // Tampilkan satu desimal jika bukan integer, jika integer tampilkan tanpa desimal
      return `${Number.isInteger(numericValue) ? numericValue : numericValue.toFixed(1)} kg`;
    }
  };


  const onSubmit = async (data: MustahikWargaInsert) => {
    try {
      const hakNumeric = parseFloat(String(data.hak));
      if (isNaN(hakNumeric)) {
        toast.error('Nilai hak tidak valid.');
        return;
      }

      const submitData = { ...data, hak: hakNumeric };

      if (openModal === 'add') {
        const { error } = await supabase.from('mustahik_warga').insert([submitData]);
        if (error) throw error;
        toast.success('Mustahik warga berhasil ditambahkan');
      } else if (openModal === 'edit' && selectedMustahik) {
        const { error } = await supabase
          .from('mustahik_warga')
          .update(submitData)
          .eq('id_mustahikwarga', selectedMustahik.id_mustahikwarga);
        if (error) throw error;
        toast.success('Mustahik warga berhasil diperbarui');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving mustahik warga:', error);
      toast.error(`Gagal menyimpan: ${error instanceof Error ? error.message : 'Kesalahan tidak diketahui'}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedMustahik) return;
    try {
      const { error } = await supabase
        .from('mustahik_warga')
        .delete()
        .eq('id_mustahikwarga', selectedMustahik.id_mustahikwarga);
      if (error) throw error;
      toast.success('Mustahik warga berhasil dihapus');
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting mustahik warga:', error);
      toast.error('Gagal menghapus mustahik warga');
    }
  };

  const printColumns = [
    { header: 'Nama', accessor: 'nama' },
    { header: 'Kategori', accessor: 'kategori' },
    { header: 'Hak', accessor: 'hak', cell: (row: MustahikWarga) => formatHakForDisplay(row.hak, row.kategori) },
  ];

  const columns = [
    { header: 'Nama', accessor: 'nama', sortable: true },
    { header: 'Kategori', accessor: 'kategori', sortable: true },
    { header: 'Hak', accessor: 'hak', sortable: true, cell: (row: MustahikWarga) => formatHakForDisplay(row.hak, row.kategori) },
    {
      header: 'Actions',
      accessor: (row: MustahikWarga) => (
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
        <h1 className="text-2xl font-bold text-gray-800">Distribusi Zakat Fitrah Warga</h1>
        <div className="flex gap-2">
          <Button variant="outline" icon={<FileDown size={16} />} onClick={handlePrint} disabled={mustahikList.length === 0}>
            Ekspor PDF
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal('add')}>
            Tambah Mustahik Warga
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mustahikList}
            keyField="id_mustahikwarga" // Disesuaikan
            isLoading={isLoading}
            emptyMessage="Tidak ada data mustahik warga yang tersedia"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableTable
            title="Data Mustahik Warga" // Disesuaikan
            columns={printColumns}
            data={mustahikList}
            keyField="id_mustahikwarga" // Disesuaikan
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Mustahik Warga' : 'Edit Mustahik Warga'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4"> {/* Menambahkan space-y-4 */}
          <Input
            label="Nama"
            placeholder="Masukkan nama mustahik"
            error={errors.nama?.message}
            disabled={openModal === 'view'} // Seharusnya tidak ada 'view' di sini, tapi untuk konsistensi
            {...register('nama', {
              required: 'Nama mustahik harus diisi',
            })}
          />

          <div> {/* Mengganti className mb-4 dengan div untuk spacing dari form */}
            <label htmlFor="kategori" className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <select
              id="kategori" // Menambahkan id untuk htmlFor
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={openModal === 'view'} // Seharusnya tidak ada 'view' di sini
              {...register('kategori', {
                required: 'Kategori mustahik harus dipilih',
              })}
            >
              <option value="">Pilih Kategori</option>
              {kategoriList.map((kategori) => (
                <option key={kategori.id_kategori} value={kategori.nama_kategori}>
                  {kategori.nama_kategori}
                </option>
              ))}
            </select>
            {errors.kategori && (
              <p className="mt-1 text-sm text-red-600">{errors.kategori.message}</p> // Mengganti text-error-600
            )}
          </div>

          <div> {/* Mengganti className mb-4 */}
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Hak
            </label>
            <div className="flex gap-x-4"> {/* Mengganti gap-4 menjadi gap-x-4 */}
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600"
                  checked={hakType === 'beras'}
                  onChange={() => setHakType('beras')}
                  disabled={openModal === 'view'} // Seharusnya tidak ada 'view' di sini
                />
                <span className="ml-2">Beras</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600"
                  checked={hakType === 'uang'}
                  onChange={() => setHakType('uang')}
                  disabled={openModal === 'view'} // Seharusnya tidak ada 'view' di sini
                />
                <span className="ml-2">Uang</span>
              </label>
            </div>
          </div>

          <Input
            label={hakType === 'beras' ? 'Hak (kg)' : 'Hak (Rp)'}
            type="number"
            step={hakType === 'beras' ? '0.1' : '1'} // step 0.1 untuk beras agar bisa desimal
            placeholder={hakType === 'beras' ? 'Masukkan jumlah beras (kg)' : 'Masukkan jumlah uang (Rp)'}
            error={errors.hak?.message}
            disabled={openModal === 'view'} // Seharusnya tidak ada 'view' di sini
            {...register('hak', {
              required: 'Hak mustahik harus diisi',
              valueAsNumber: true, // Penting untuk konversi ke number
              min: {
                value: 0,
                message: 'Hak tidak boleh negatif',
              },
            })}
          />
          {/* Menampilkan nilai otomatis */}
          { (formKategori && hakType && openModal !== 'view' ) &&
            <p className="text-xs text-gray-500 -mt-2"> {/* Penyesuaian style agar tidak terlalu jauh */}
              Otomatis: {
                (() => {
                  const kat = kategoriList.find(k => k.nama_kategori === formKategori);
                  if (!kat) return '-';
                  const nilaiOtomatis = hakType === 'beras' ? kat.jumlah_hak : kat.jumlah_hak * exchangeRate;
                  return formatHakForDisplay(nilaiOtomatis, formKategori); // Gunakan formatHakForDisplay
                })()
              }
            </p>
          }

          <div className="flex justify-end space-x-2 pt-2"> {/* Mengganti mt-6 dengan pt-2 */}
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button variant="primary" type="submit" disabled={isLoading}>
              {openModal === 'add' ? 'Simpan' : 'Perbarui'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={openModal === 'view'}
        onClose={handleCloseModal}
        title="Detail Mustahik Warga"
      >
        {selectedMustahik && (
          <div className="space-y-3"> {/* Mengganti space-y-4 */}
            <div><h3 className="text-sm font-medium text-gray-500">Nama</h3><p className="mt-1 text-base">{selectedMustahik.nama}</p></div>
            <div><h3 className="text-sm font-medium text-gray-500">Kategori</h3><p className="mt-1 text-base">{selectedMustahik.kategori}</p></div>
            <div><h3 className="text-sm font-medium text-gray-500">Hak Diterima</h3><p className="mt-1 text-base">{formatHakForDisplay(selectedMustahik.hak, selectedMustahik.kategori)}</p></div>
            <div className="flex justify-end space-x-2 pt-3"> {/* Mengganti mt-6 */}
              <Button variant="outline" onClick={handleCloseModal}>
                Tutup
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  // handleCloseModal(); // Tidak perlu close dulu jika langsung edit
                  handleOpenModal('edit', selectedMustahik);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={openModal === 'delete'}
        onClose={handleCloseModal}
        title="Hapus Mustahik Warga"
      >
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus mustahik warga{' '}
          <span className="font-medium">{selectedMustahik?.nama}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCloseModal}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isLoading}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MustahikWargaPage;