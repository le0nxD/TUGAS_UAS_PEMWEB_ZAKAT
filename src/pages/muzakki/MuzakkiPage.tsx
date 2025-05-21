import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { Database } from '../../lib/database.types';
import supabase from '../../lib/supabase';
import { Plus, Edit, Trash, Info, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import { useReactToPrint } from 'react-to-print';
import PrintableTable from '../../components/ui/PrintableTable';

type Muzakki = Database['public']['Tables']['muzakki']['Row'];
type MuzakkiInsert = Database['public']['Tables']['muzakki']['Insert'];

const MuzakkiPage: React.FC = () => {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMuzakki, setSelectedMuzakki] = useState<Muzakki | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<MuzakkiInsert>();

  useEffect(() => {
    fetchMuzakki();
  }, []);

  useEffect(() => {
    if (selectedMuzakki && (openModal === 'edit' || openModal === 'view')) {
      setValue('nama_muzakki', selectedMuzakki.nama_muzakki);
      setValue('jumlah_tanggungan', selectedMuzakki.jumlah_tanggungan);
      setValue('keterangan', selectedMuzakki.keterangan || '');
    }
  }, [selectedMuzakki, openModal, setValue]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Data_Muzakki_${new Date().toLocaleDateString('id-ID')}`,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

  const fetchMuzakki = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('muzakki')
        .select('*')
        .order('nama_muzakki', { ascending: true });

      if (error) {
        throw error;
      }

      setMuzakkiList(data || []);
    } catch (error) {
      console.error('Error fetching muzakki:', error);
      toast.error('Gagal mengambil data muzakki');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (
    type: 'add' | 'edit' | 'view' | 'delete',
    muzakki: Muzakki | null = null
  ) => {
    setSelectedMuzakki(muzakki);
    setOpenModal(type);
    if (type === 'add') {
      reset({
        nama_muzakki: '',
        jumlah_tanggungan: 0,
        keterangan: '',
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedMuzakki(null);
    reset();
  };

  const onSubmit = async (data: MuzakkiInsert) => {
    try {
      if (openModal === 'add') {
        const { error } = await supabase.from('muzakki').insert([data]);
        if (error) throw error;
        toast.success('Muzakki berhasil ditambahkan');
      } else if (openModal === 'edit' && selectedMuzakki) {
        const { error } = await supabase
          .from('muzakki')
          .update(data)
          .eq('id_muzakki', selectedMuzakki.id_muzakki);
        if (error) throw error;
        toast.success('Muzakki berhasil diperbarui');
      }
      fetchMuzakki();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving muzakki:', error);
      toast.error('Gagal menyimpan data muzakki');
    }
  };

  const handleDelete = async () => {
    if (!selectedMuzakki) return;
    try {
      const { error } = await supabase
        .from('muzakki')
        .delete()
        .eq('id_muzakki', selectedMuzakki.id_muzakki);
      if (error) throw error;
      toast.success('Muzakki berhasil dihapus');
      fetchMuzakki();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting muzakki:', error);
      toast.error('Gagal menghapus muzakki');
    }
  };

  const printColumns = [
    {
      header: 'Nama Muzakki',
      accessor: 'nama_muzakki',
    },
    {
      header: 'Jumlah Tanggungan',
      accessor: 'jumlah_tanggungan',
    },
    {
      header: 'Keterangan',
      accessor: 'keterangan',
      cell: (row: Muzakki) => row.keterangan || '-',
    },
  ];

  const columns = [
    {
      header: 'Nama Muzakki',
      accessor: 'nama_muzakki',
      sortable: true,
    },
    {
      header: 'Jumlah Tanggungan',
      accessor: 'jumlah_tanggungan',
      sortable: true,
    },
    {
      header: 'Keterangan',
      accessor: 'keterangan',
      sortable: false,
      cell: (row: Muzakki) => (
        <span className="truncate">{row.keterangan || '-'}</span>
      ),
    },
    {
      header: 'Actions',
      accessor: (row: Muzakki) => (
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
        <h1 className="text-2xl font-bold text-gray-800">Data Muzakki</h1>
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
            Tambah Muzakki
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={muzakkiList}
            keyField="id_muzakki"
            isLoading={isLoading}
            emptyMessage="Tidak ada data muzakki yang tersedia"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      {/* Printable Content */}
      <div className="hidden">
        <div ref={printRef}>
          <PrintableTable
            title="Data Muzakki"
            columns={printColumns}
            data={muzakkiList}
            keyField="id_muzakki"
          />
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Muzakki' : 'Edit Muzakki'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nama Muzakki"
            placeholder="Masukkan nama muzakki"
            error={errors.nama_muzakki?.message}
            disabled={openModal === 'view'}
            {...register('nama_muzakki', {
              required: 'Nama muzakki harus diisi',
            })}
          />

          <Input
            label="Jumlah Tanggungan"
            type="number"
            placeholder="Masukkan jumlah tanggungan"
            min={0}
            error={errors.jumlah_tanggungan?.message}
            disabled={openModal === 'view'}
            {...register('jumlah_tanggungan', {
              required: 'Jumlah tanggungan harus diisi',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Jumlah tanggungan tidak boleh negatif',
              },
            })}
          />

          <Input
            label="Keterangan"
            placeholder="Masukkan keterangan (opsional)"
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
        title="Detail Muzakki"
      >
        {selectedMuzakki && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama Muzakki</h3>
              <p className="mt-1 text-lg">{selectedMuzakki.nama_muzakki}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Jumlah Tanggungan</h3>
              <p className="mt-1 text-lg">{selectedMuzakki.jumlah_tanggungan}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Keterangan</h3>
              <p className="mt-1 text-lg">{selectedMuzakki.keterangan || '-'}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Tutup
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleCloseModal();
                  handleOpenModal('edit', selectedMuzakki);
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
        title="Hapus Muzakki"
      >
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus muzakki{' '}
          <span className="font-medium">{selectedMuzakki?.nama_muzakki}</span>?
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

export default MuzakkiPage;
