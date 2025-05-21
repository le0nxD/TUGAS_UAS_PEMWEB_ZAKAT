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

type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'];
type KategoriMustahikInsert = Database['public']['Tables']['kategori_mustahik']['Insert'];

const KategoriPage: React.FC = () => {
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<KategoriMustahik | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<KategoriMustahikInsert>();

  useEffect(() => {
    fetchKategori();
  }, []);

  useEffect(() => {
    if (selectedKategori && (openModal === 'edit' || openModal === 'view')) {
      setValue('nama_kategori', selectedKategori.nama_kategori);
      setValue('jumlah_hak', selectedKategori.jumlah_hak);
      setValue('keterangan', selectedKategori.keterangan || '');
    }
  }, [selectedKategori, openModal, setValue]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Kategori_Mustahik_${new Date().toLocaleDateString('id-ID')}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

  const fetchKategori = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('kategori_mustahik')
        .select('*')
        .order('nama_kategori', { ascending: true });

      if (error) {
        throw error;
      }

      setKategoriList(data || []);
    } catch (error) {
      console.error('Error fetching kategori:', error);
      toast.error('Gagal mengambil data kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (
    type: 'add' | 'edit' | 'view' | 'delete',
    kategori: KategoriMustahik | null = null
  ) => {
    setSelectedKategori(kategori);
    setOpenModal(type);
    if (type === 'add') {
      reset({
        nama_kategori: '',
        jumlah_hak: 0,
        keterangan: '',
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedKategori(null);
    reset();
  };

  const onSubmit = async (data: KategoriMustahikInsert) => {
    try {
      if (openModal === 'add') {
        const { error } = await supabase.from('kategori_mustahik').insert([data]);
        if (error) throw error;
        toast.success('Kategori berhasil ditambahkan');
      } else if (openModal === 'edit' && selectedKategori) {
        const { error } = await supabase
          .from('kategori_mustahik')
          .update(data)
          .eq('id_kategori', selectedKategori.id_kategori);
        if (error) throw error;
        toast.success('Kategori berhasil diperbarui');
      }
      fetchKategori();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving kategori:', error);
      toast.error('Gagal menyimpan data kategori');
    }
  };

  const handleDelete = async () => {
    if (!selectedKategori) return;
    try {
      const { error } = await supabase
        .from('kategori_mustahik')
        .delete()
        .eq('id_kategori', selectedKategori.id_kategori);
      if (error) throw error;
      toast.success('Kategori berhasil dihapus');
      fetchKategori();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting kategori:', error);
      toast.error('Gagal menghapus kategori');
    }
  };

  const printColumns = [
    {
      header: 'Nama Kategori',
      accessor: 'nama_kategori',
    },
    {
      header: 'Jumlah Hak',
      accessor: 'jumlah_hak',
    },
    {
      header: 'Keterangan',
      accessor: 'keterangan',
      cell: (row: KategoriMustahik) => row.keterangan || '-',
    },
  ];

  const columns = [
    {
      header: 'Nama Kategori',
      accessor: 'nama_kategori',
      sortable: true,
    },
    {
      header: 'Jumlah Hak',
      accessor: 'jumlah_hak',
      sortable: true,
    },
    {
      header: 'Keterangan',
      accessor: 'keterangan',
      sortable: true,
      cell: (row: KategoriMustahik) => row.keterangan || '-',
    },
    {
      header: 'Actions',
      accessor: (row: KategoriMustahik) => (
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
        <h1 className="text-2xl font-bold text-gray-800">Kategori Mustahik</h1>
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
            Tambah Kategori
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={kategoriList}
            keyField="id_kategori"
            isLoading={isLoading}
            emptyMessage="Tidak ada data kategori yang tersedia"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableTable
            title="Data Kategori Mustahik"
            columns={printColumns}
            data={kategoriList}
            keyField="id_kategori"
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Kategori' : 'Edit Kategori'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nama Kategori"
            placeholder="Masukkan nama kategori"
            error={errors.nama_kategori?.message}
            disabled={openModal === 'view'}
            {...register('nama_kategori', {
              required: 'Nama kategori harus diisi',
            })}
          />

          <Input
            label="Jumlah Hak"
            type="number"
            step="0.01"
            placeholder="Masukkan jumlah hak"
            error={errors.jumlah_hak?.message}
            disabled={openModal === 'view'}
            {...register('jumlah_hak', {
              required: 'Jumlah hak harus diisi',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Jumlah hak tidak boleh negatif',
              },
            })}
          />

          <Input
            label="Keterangan"
            placeholder="Masukkan keterangan (opsional)"
            error={errors.keterangan?.message}
            disabled={openModal === 'view'}
            {...register('keterangan')}
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
        title="Detail Kategori"
      >
        {selectedKategori && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama Kategori</h3>
              <p className="mt-1 text-lg">{selectedKategori.nama_kategori}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Jumlah Hak</h3>
              <p className="mt-1 text-lg">{selectedKategori.jumlah_hak}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Keterangan</h3>
              <p className="mt-1 text-lg">{selectedKategori.keterangan || '-'}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Tutup
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  handleCloseModal();
                  handleOpenModal('edit', selectedKategori);
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
        title="Hapus Kategori"
      >
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus kategori{' '}
          <span className="font-medium">{selectedKategori?.nama_kategori}</span>?
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

export default KategoriPage;