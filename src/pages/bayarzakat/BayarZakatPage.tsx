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

type BayarZakat = Database['public']['Tables']['bayarzakat']['Row'];
type BayarZakatInsert = Database['public']['Tables']['bayarzakat']['Insert'];

const BayarZakatPage: React.FC = () => {
  const [zakatList, setZakatList] = useState<BayarZakat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | null>(null);
  const [selectedZakat, setSelectedZakat] = useState<BayarZakat | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BayarZakatInsert>();

  const jenisBayar = watch('jenis_bayar');

  useEffect(() => {
    fetchZakat();
  }, []);

  useEffect(() => {
    if (selectedZakat && (openModal === 'edit' || openModal === 'view')) {
      setValue('nama_kk', selectedZakat.nama_kk);
      setValue('jumlah_tanggungan', selectedZakat.jumlah_tanggungan);
      setValue('jenis_bayar', selectedZakat.jenis_bayar);
      setValue('jumlah_tanggunganyang_dibayar', selectedZakat.jumlah_tanggunganyang_dibayar);
      setValue('bayar_beras', selectedZakat.bayar_beras);
      setValue('bayar_uang', selectedZakat.bayar_uang);
    }
  }, [selectedZakat, openModal, setValue]);

  const fetchZakat = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bayarzakat')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setZakatList(data || []);
    } catch (error) {
      console.error('Error fetching zakat data:', error);
      toast.error('Failed to fetch zakat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (
    type: 'add' | 'edit' | 'view' | 'delete',
    zakat: BayarZakat | null = null
  ) => {
    setSelectedZakat(zakat);
    setOpenModal(type);
    if (type === 'add') {
      reset({
        nama_kk: '',
        jumlah_tanggungan: 0,
        jenis_bayar: 'beras',
        jumlah_tanggunganyang_dibayar: 0,
        bayar_beras: 0,
        bayar_uang: 0,
      });
    }
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedZakat(null);
    reset();
  };

  const onSubmit = async (data: BayarZakatInsert) => {
    try {
      // Set the appropriate payment field based on jenis_bayar
      if (data.jenis_bayar === 'beras') {
        data.bayar_uang = null;
      } else {
        data.bayar_beras = null;
      }

      if (openModal === 'add') {
        const { error } = await supabase.from('bayarzakat').insert([data]);
        if (error) throw error;
        toast.success('Pembayaran zakat added successfully');
      } else if (openModal === 'edit' && selectedZakat) {
        const { error } = await supabase
          .from('bayarzakat')
          .update(data)
          .eq('id_zakat', selectedZakat.id_zakat);
        if (error) throw error;
        toast.success('Pembayaran zakat updated successfully');
      }
      fetchZakat();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving zakat payment:', error);
      toast.error('Failed to save zakat payment data');
    }
  };

  const handleDelete = async () => {
    if (!selectedZakat) return;
    try {
      const { error } = await supabase
        .from('bayarzakat')
        .delete()
        .eq('id_zakat', selectedZakat.id_zakat);
      if (error) throw error;
      toast.success('Pembayaran zakat deleted successfully');
      fetchZakat();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting zakat payment:', error);
      toast.error('Failed to delete zakat payment');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const columns = [
    {
      header: 'Nama KK',
      accessor: 'nama_kk',
      sortable: true,
    },
    {
      header: 'Tanggungan',
      accessor: 'jumlah_tanggungan',
      sortable: true,
    },
    {
      header: 'Dibayar',
      accessor: 'jumlah_tanggunganyang_dibayar',
      sortable: true,
    },
    {
      header: 'Jenis Bayar',
      accessor: 'jenis_bayar',
      sortable: true,
      cell: (row: BayarZakat) => (
        <span className="capitalize">{row.jenis_bayar}</span>
      ),
    },
    {
      header: 'Beras',
      accessor: 'bayar_beras',
      sortable: true,
      cell: (row: BayarZakat) => (
        <span>{row.bayar_beras ? `${row.bayar_beras} kg` : '-'}</span>
      ),
    },
    {
      header: 'Uang',
      accessor: 'bayar_uang',
      sortable: true,
      cell: (row: BayarZakat) => (
        <span>{formatCurrency(row.bayar_uang)}</span>
      ),
    },
    {
      header: 'Tanggal',
      accessor: 'created_at',
      sortable: true,
      cell: (row: BayarZakat) => formatDate(row.created_at),
    },
    {
      header: 'Actions',
      accessor: (row: BayarZakat) => (
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
        <h1 className="text-2xl font-bold text-gray-800">Pengumpulan Zakat Fitrah</h1>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => handleOpenModal('add')}
        >
          Tambah Pembayaran
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={zakatList}
            keyField="id_zakat"
            isLoading={isLoading}
            emptyMessage="No zakat payment data available"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Pembayaran Zakat' : 'Edit Pembayaran Zakat'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input
            label="Nama Kepala Keluarga"
            placeholder="Masukkan nama kepala keluarga"
            error={errors.nama_kk?.message}
            disabled={openModal === 'view'}
            {...register('nama_kk', {
              required: 'Nama kepala keluarga harus diisi',
            })}
          />

          <Input
            label="Jumlah Tanggungan"
            type="number"
            placeholder="Masukkan jumlah tanggungan"
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
            label="Jumlah Tanggungan yang Dibayar"
            type="number"
            placeholder="Masukkan jumlah tanggungan yang dibayar"
            error={errors.jumlah_tanggunganyang_dibayar?.message}
            disabled={openModal === 'view'}
            {...register('jumlah_tanggunganyang_dibayar', {
              required: 'Jumlah tanggungan yang dibayar harus diisi',
              valueAsNumber: true,
              min: {
                value: 0,
                message: 'Jumlah tanggungan yang dibayar tidak boleh negatif',
              },
            })}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Pembayaran
            </label>
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="beras"
                  type="radio"
                  value="beras"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  disabled={openModal === 'view'}
                  {...register('jenis_bayar', { required: true })}
                />
                <label htmlFor="beras" className="ml-2 text-sm text-gray-700">
                  Beras
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="uang"
                  type="radio"
                  value="uang"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                  disabled={openModal === 'view'}
                  {...register('jenis_bayar', { required: true })}
                />
                <label htmlFor="uang" className="ml-2 text-sm text-gray-700">
                  Uang
                </label>
              </div>
            </div>
            {errors.jenis_bayar && (
              <p className="mt-1 text-sm text-error-600">Jenis pembayaran harus dipilih</p>
            )}
          </div>

          {jenisBayar === 'beras' && (
            <Input
              label="Jumlah Beras (kg)"
              type="number"
              step="0.1"
              placeholder="Masukkan jumlah beras"
              error={errors.bayar_beras?.message}
              disabled={openModal === 'view'}
              {...register('bayar_beras', {
                required: 'Jumlah beras harus diisi',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'Jumlah beras tidak boleh negatif',
                },
              })}
            />
          )}

          {jenisBayar === 'uang' && (
            <Input
              label="Jumlah Uang (Rp)"
              type="number"
              placeholder="Masukkan jumlah uang"
              error={errors.bayar_uang?.message}
              disabled={openModal === 'view'}
              {...register('bayar_uang', {
                required: 'Jumlah uang harus diisi',
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'Jumlah uang tidak boleh negatif',
                },
              })}
            />
          )}

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
        title="Detail Pembayaran Zakat"
      >
        {selectedZakat && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Nama Kepala Keluarga</h3>
              <p className="mt-1 text-lg">{selectedZakat.nama_kk}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Jumlah Tanggungan</h3>
                <p className="mt-1 text-lg">{selectedZakat.jumlah_tanggungan}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Jumlah Dibayar</h3>
                <p className="mt-1 text-lg">{selectedZakat.jumlah_tanggunganyang_dibayar}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Jenis Pembayaran</h3>
              <p className="mt-1 text-lg capitalize">{selectedZakat.jenis_bayar}</p>
            </div>
            {selectedZakat.jenis_bayar === 'beras' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Jumlah Beras</h3>
                <p className="mt-1 text-lg">{selectedZakat.bayar_beras} kg</p>
              </div>
            )}
            {selectedZakat.jenis_bayar === 'uang' && (
              <div>
                <h3 className="text-sm font-medium text-gray-500">Jumlah Uang</h3>
                <p className="mt-1 text-lg">{formatCurrency(selectedZakat.bayar_uang)}</p>
              </div>
            )}
            <div>
              <h3 className="text-sm font-medium text-gray-500">Tanggal Pembayaran</h3>
              <p className="mt-1 text-lg">{formatDate(selectedZakat.created_at)}</p>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={handleCloseModal}>
                Tutup
              </Button>
              <Button 
                variant="primary" 
                onClick={() => {
                  handleCloseModal();
                  handleOpenModal('edit', selectedZakat);
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
        title="Hapus Pembayaran Zakat"
      >
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus pembayaran zakat dari{' '}
          <span className="font-medium">{selectedZakat?.nama_kk}</span>?
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

export default BayarZakatPage;