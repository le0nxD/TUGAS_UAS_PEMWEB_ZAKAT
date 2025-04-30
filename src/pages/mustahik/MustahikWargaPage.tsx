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

type MustahikWarga = Database['public']['Tables']['mustahik_warga']['Row'];
type MustahikWargaInsert = Database['public']['Tables']['mustahik_warga']['Insert'];
type KategoriMustahik = Database['public']['Tables']['kategori_mustahik']['Row'];

const MustahikWargaPage: React.FC = () => {
  const [mustahikList, setMustahikList] = useState<MustahikWarga[]>([]);
  const [kategoriList, setKategoriList] = useState<KategoriMustahik[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedMustahik, setSelectedMustahik] = useState<MustahikWarga | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MustahikWargaInsert>();

  const selectedKategori = watch('kategori');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMustahik && (openModal === 'edit' || openModal === 'view')) {
      setValue('nama', selectedMustahik.nama);
      setValue('kategori', selectedMustahik.kategori);
      setValue('hak', selectedMustahik.hak);
    }
  }, [selectedMustahik, openModal, setValue]);

  // Update hak value when kategori changes
  useEffect(() => {
    if (selectedKategori && kategoriList.length > 0) {
      const kategori = kategoriList.find(k => k.nama_kategori === selectedKategori);
      if (kategori) {
        setValue('hak', kategori.jumlah_hak);
      }
    }
  }, [selectedKategori, kategoriList, setValue]);

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
      toast.error('Failed to fetch data');
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
        hak: 0,
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedMustahik(null);
    reset();
  };

  const onSubmit = async (data: MustahikWargaInsert) => {
    try {
      if (openModal === 'add') {
        const { error } = await supabase.from('mustahik_warga').insert([data]);
        if (error) throw error;
        toast.success('Mustahik warga added successfully');
      } else if (openModal === 'edit' && selectedMustahik) {
        const { error } = await supabase
          .from('mustahik_warga')
          .update(data)
          .eq('id_mustahikwarga', selectedMustahik.id_mustahikwarga);
        if (error) throw error;
        toast.success('Mustahik warga updated successfully');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving mustahik warga:', error);
      toast.error('Failed to save mustahik warga data');
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
      toast.success('Mustahik warga deleted successfully');
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting mustahik warga:', error);
      toast.error('Failed to delete mustahik warga');
    }
  };

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
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => handleOpenModal('add')}
        >
          Tambah Mustahik Warga
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={mustahikList}
            keyField="id_mustahikwarga"
            isLoading={isLoading}
            emptyMessage="No mustahik warga data available"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

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

          <Input
            label="Hak"
            type="number"
            step="0.01"
            placeholder="Hak akan otomatis terisi berdasarkan kategori"
            error={errors.hak?.message}
            disabled={true}
            {...register('hak', {
              required: 'Hak mustahik harus diisi',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Hak tidak boleh negatif',
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
              <p className="mt-1 text-lg">{selectedMustahik.hak}</p>
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

export default MustahikWargaPage;