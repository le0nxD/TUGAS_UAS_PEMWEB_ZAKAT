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
type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'];

const MustahikWargaPage: React.FC = () => {
  const [mustahikList, setMustahikList] = useState<MustahikWarga[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMustahik, setSelectedMustahik] = useState<MustahikWarga | null>(null);
  const [hakType, setHakType] = useState<'beras' | 'uang'>('beras');
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MustahikWargaInsert>();

  const selectedKategori = watch('kategori');
  const hakValue = watch('hak');
  const exchangeRate = 15000; // Nilai tukar beras ke rupiah (1 kg = Rp 15.000)

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMustahik && (openModal === 'edit' || openModal === 'view')) {
      setValue('nama', selectedMustahik.nama);
      setValue('kategori', selectedMustahik.kategori);
      setValue('hak', selectedMustahik.hak);
      
      // Determine hak type based on kategori
      const kategori = kategoriList.find(k => k.nama_kategori === selectedMustahik.kategori);
      if (kategori) {
        setHakType(kategori.jumlah_hak >= 1000 ? 'uang' : 'beras');
      }
    }
  }, [selectedMustahik, openModal, setValue, kategoriList]);

  // Update hak value when kategori changes
  useEffect(() => {
    if (selectedKategori && kategoriList.length > 0) {
      const kategori = kategoriList.find(k => k.nama_kategori === selectedKategori);
      if (kategori) {
        if (hakType === 'beras') {
          setValue('hak', kategori.jumlah_hak);
        } else {
          setValue('hak', kategori.jumlah_hak * exchangeRate);
        }
      }
    }
  }, [selectedKategori, kategoriList, setValue, hakType, exchangeRate]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Data_Mustahik_Warga_${new Date().toLocaleDateString('id-ID')}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
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
      reset({
        nama: '',
        kategori: '',
        hak: '',
      });
      setHakType('beras');
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedMustahik(null);
    reset();
  };

  const formatHak = (value: number) => {
    const kategori = kategoriList.find(k => k.jumlah_hak === value || k.jumlah_hak * exchangeRate === value);
    if (kategori) {
      if (kategori.jumlah_hak >= 1000) {
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value);
      } else {
        return `${value} kg`;
      }
    }
    return value >= 1000 
      ? new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(value)
      : `${value} kg`;
  };

  const onSubmit = async (data: MustahikWargaInsert) => {
    try {
      // Ensure hak is a numeric value
      const hakNumeric = parseFloat(String(data.hak));
      if (isNaN(hakNumeric)) {
        throw new Error('Hak harus berupa angka');
      }

      const submitData = {
        ...data,
        hak: hakNumeric,
      };

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
      toast.error('Gagal menyimpan data mustahik warga');
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
    {
      header: 'Nama',
      accessor: 'nama',
    },
    {
      header: 'Kategori',
      accessor: 'kategori',
    },
    {
      header: 'Hak',
      accessor: 'hak',
      cell: (row: MustahikWarga) => formatHak(row.hak),
    },
  ];

  const columns = [
    {
      header: 'Nama',
      accessor: 'nama',
      sortable: true,
    },
    {
      header: 'Kategori',
      accessor: 'kategori',
      sortable: true,
    },
    {
      header: 'Hak',
      accessor: 'hak',
      sortable: true,
      cell: (row: MustahikWarga) => formatHak(row.hak),
    },
    {
      header: 'Actions',
      accessor: (row: MustahikWarga) => (
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<Info size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal('view', row);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Edit size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal('edit', row);
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash size={16} />}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenModal('delete', row);
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Distribusi Zakat Fitrah Warga</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            icon={<FileDown size={16} />}
            onClick={handlePrint}
          >
            Ekspor PDF
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal('add')}
          >
            Tambah Mustahik Warga
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mustahikList}
            keyField="id_mustahikwarga"
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
            title="Data Mustahik"
            columns={printColumns}
            data={mustahikList}
            keyField="id_mustahikwarga"
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Mustahik Warga' : 'Edit Mustahik Warga'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nama"
            placeholder="Masukkan nama mustahik"
            error={errors.nama?.message}
            disabled={openModal === 'view'}
            {...register('nama', {
              required: 'Nama mustahik harus diisi',
            })}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kategori
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              {...register('kategori', {
                required: 'Kategori mustahik harus dipilih',
              })}
              disabled={openModal === 'view'}
            >
              <option value="">Pilih Kategori</option>
              {kategoriList.map((kategori) => (
                <option key={kategori.id_kategori} value={kategori.nama_kategori}>
                  {kategori.nama_kategori}
                </option>
              ))}
            </select>
            {errors.kategori && (
              <p className="mt-1 text-sm text-error-600">{errors.kategori.message}</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Hak
            </label>
            <div className="flex gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600"
                  checked={hakType === 'beras'}
                  onChange={() => setHakType('beras')}
                  disabled={openModal === 'view'}
                />
                <span className="ml-2">Beras</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  className="form-radio text-primary-600"
                  checked={hakType === 'uang'}
                  onChange={() => setHakType('uang')}
                  disabled={openModal === 'view'}
                />
                <span className="ml-2">Uang</span>
              </label>
            </div>
          </div>

          <Input
            label={hakType === 'beras' ? 'Hak (kg)' : 'Hak (Rp)'}
            type="number"
            step={hakType === 'beras' ? '0.1' : '1'}
            placeholder={hakType === 'beras' ? 'Masukkan jumlah beras (kg)' : 'Masukkan jumlah uang (Rp)'}
            error={errors.hak?.message}
            disabled={openModal === 'view'}
            {...register('hak', {
              required: 'Hak mustahik harus diisi',
              min: {
                value: 0,
                message: 'Hak tidak boleh negatif',
              },
              valueAsNumber: true,
            })}
          />

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
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
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama</h3>
              <p className="mt-1 text-lg">{selectedMustahik.nama}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Kategori</h3>
              <p className="mt-1 text-lg">{selectedMustahik.kategori}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Hak</h3>
              <p className="mt-1 text-lg">{formatHak(selectedMustahik.hak)}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Tutup
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseModal();
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
          <Button variant="danger" onClick={handleDelete}>
            Hapus
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default MustahikWargaPage;