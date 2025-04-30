import React, { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { Database } from '../../lib/database.types';
import supabase from '../../lib/supabase';
import { Plus, Edit, Trash, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';

type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'];
type KategoriMustahikInsert = Database['public']['Tables']['kategori_mustahik']['Insert'];

const KategoriPage: React.FC = () => {
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedKategori, setSelectedKategori] = useState<KategoriMustahik | null>(null);

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
    }
  }, [selectedKategori, openModal, setValue]);

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
      toast.error('Failed to fetch kategori data');
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
        toast.success('Kategori added successfully');
      } else if (openModal === 'edit' && selectedKategori) {
        const { error } = await supabase
          .from('kategori_mustahik')
          .update(data)
          .eq('id_kategori', selectedKategori.id_kategori);
        if (error) throw error;
        toast.success('Kategori updated successfully');
      }
      fetchKategori();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving kategori:', error);
      toast.error('Failed to save kategori data');
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
      toast.success('Kategori deleted successfully');
      fetchKategori();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting kategori:', error);
      toast.error('Failed to delete kategori');
    }
  };

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
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => handleOpenModal('add')}
        >
          Tambah Kategori
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={kategoriList}
            keyField="id_kategori"
            isLoading={isLoading}
            emptyMessage="No kategori data available"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

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

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {openModal === 'add' ? 'Simpan' : 'Update'}
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
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default KategoriPage;