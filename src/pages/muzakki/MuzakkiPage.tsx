import React, { useState, useEffect } from 'react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, CardHeader, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { Database } from '../../lib/database.types';
import supabase from '../../lib/supabase';
import { Plus, Edit, Trash, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';

type Muzakki = Database['public']['Tables']['muzakki']['Row'];
type MuzakkiInsert = Database['public']['Tables']['muzakki']['Insert'];

const MuzakkiPage: React.FC = () => {
  const [muzakkiList, setMuzakkiList] = useState<Muzakki[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMuzakki, setSelectedMuzakki] = useState<Muzakki | null>(null);

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
      toast.error('Failed to fetch muzakki data');
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
        toast.success('Muzakki added successfully');
      } else if (openModal === 'edit' && selectedMuzakki) {
        const { error } = await supabase
          .from('muzakki')
          .update(data)
          .eq('id_muzakki', selectedMuzakki.id_muzakki);
        if (error) throw error;
        toast.success('Muzakki updated successfully');
      }
      fetchMuzakki();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving muzakki:', error);
      toast.error('Failed to save muzakki data');
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
      toast.success('Muzakki deleted successfully');
      fetchMuzakki();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting muzakki:', error);
      toast.error('Failed to delete muzakki');
    }
  };

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
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => handleOpenModal('add')}
        >
          Tambah Muzakki
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={muzakkiList}
            keyField="id_muzakki"
            isLoading={isLoading}
            emptyMessage="No muzakki data available"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

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

export default MuzakkiPage;