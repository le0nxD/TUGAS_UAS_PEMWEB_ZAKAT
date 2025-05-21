import React, { useState, useEffect, useRef } from 'react';
import DataTable from '../../components/ui/DataTable';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Card, CardContent } from '../../components/ui/Card';
import { useForm } from 'react-hook-form';
import { Database } from '../../lib/database.types';
import supabase from '../../lib/supabase';
import { Plus, Edit, Trash, Info, FileDown, Settings } from 'lucide-react';
import toast from 'react-hot-toast';
import Input from '../../components/ui/Input';
import { useReactToPrint } from 'react-to-print';
import PrintableTable from '../../components/ui/PrintableTable';
import RadioGroup from '../../components/ui/RadioGroup';

type BayarZakat = Database['public']['Tables']['bayarzakat']['Row'];
type BayarZakatInsert = Database['public']['Tables']['bayarzakat']['Insert'];

const BayarZakatPage: React.FC = () => {
  const [zakatList, setZakatList] = useState<BayarZakat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState<'add' | 'edit' | 'view' | 'delete' | 'settings' | null>(null);
  const [selectedZakat, setSelectedZakat] = useState<BayarZakat | null>(null);
  const [berasPerJiwa, setBerasPerJiwa] = useState(() => {
    const saved = localStorage.getItem('berasPerJiwa');
    return saved ? parseFloat(saved) : 2.5;
  });
  const [nominalUang, setNominalUang] = useState(() => {
    const saved = localStorage.getItem('nominalUang');
    return saved ? parseInt(saved) : 45000;
  });
  const printRef = useRef<HTMLDivElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BayarZakatInsert>({
    defaultValues: {
      nama_kk: '',
      jumlah_tanggungan: 0,
      jenis_bayar: 'beras',
      jumlah_tanggunganyang_dibayar: 0,
      bayar_beras: 0,
      bayar_uang: null,
    },
  });

  const jenisBayar = watch('jenis_bayar');
  const jumlahTanggungan = watch('jumlah_tanggungan');
  const jumlahTanggunganDibayar = watch('jumlah_tanggunganyang_dibayar');

  // Auto-calculate payment based on type and number of dependents paid
  useEffect(() => {
    const tanggunganDibayarNumeric = typeof jumlahTanggunganDibayar === 'number' ? jumlahTanggunganDibayar : 0;

    if (jenisBayar) {
      if (jenisBayar === 'beras') {
        setValue('bayar_beras', berasPerJiwa * tanggunganDibayarNumeric, { shouldValidate: true });
        setValue('bayar_uang', null);
      } else if (jenisBayar === 'uang') {
        setValue('bayar_uang', nominalUang * tanggunganDibayarNumeric, { shouldValidate: true });
        setValue('bayar_beras', null);
      }
    }
  }, [jenisBayar, jumlahTanggunganDibayar, setValue, berasPerJiwa, nominalUang]);

  useEffect(() => {
    fetchZakat();
  }, []);

  // Populate form when editing or viewing existing zakat payment
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

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `Data_Pembayaran_Zakat_${new Date().toLocaleDateString('id-ID')}`,
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

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
      toast.error('Gagal mengambil data pembayaran zakat');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (
    type: 'add' | 'edit' | 'view' | 'delete' | 'settings',
    zakat: BayarZakat | null = null
  ) => {
    setSelectedZakat(zakat);
    setOpenModal(type);
    if (type === 'add') {
      reset({ // Reset to default values, then useEffect will calculate based on these
        nama_kk: '',
        jumlah_tanggungan: 0,
        jenis_bayar: 'beras',
        jumlah_tanggunganyang_dibayar: 0,
        bayar_beras: 0, // Will be (berasPerJiwa * 0)
        bayar_uang: null,
      });
    }
    // For 'edit', the useEffect for selectedZakat will populate the form
  };

  const handleCloseModal = () => {
    setOpenModal(null);
    setSelectedZakat(null);
    reset(); // Reset to form default values
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || typeof amount === 'undefined') return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const onSubmit = async (data: BayarZakatInsert) => {
    // Ensure numeric values are numbers, not strings from input
    const submissionData: BayarZakatInsert = {
        ...data,
        jumlah_tanggungan: Number(data.jumlah_tanggungan),
        jumlah_tanggunganyang_dibayar: Number(data.jumlah_tanggunganyang_dibayar),
        bayar_beras: data.bayar_beras ? Number(data.bayar_beras) : null,
        bayar_uang: data.bayar_uang ? Number(data.bayar_uang) : null,
    };

    try {
      if (openModal === 'add') {
        const { error } = await supabase.from('bayarzakat').insert([submissionData]);
        if (error) throw error;
        toast.success('Pembayaran zakat berhasil ditambahkan');
      } else if (openModal === 'edit' && selectedZakat) {
        const { error } = await supabase
          .from('bayarzakat')
          .update(submissionData)
          .eq('id_zakat', selectedZakat.id_zakat);
        if (error) throw error;
        toast.success('Pembayaran zakat berhasil diperbarui');
      }
      fetchZakat();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving zakat payment:', error);
      toast.error('Gagal menyimpan data pembayaran zakat');
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
      toast.success('Pembayaran zakat berhasil dihapus');
      fetchZakat();
      handleCloseModal();
    } catch (error) {
      console.error('Error deleting zakat payment:', error);
      toast.error('Gagal menghapus pembayaran zakat');
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem('berasPerJiwa', berasPerJiwa.toString());
    localStorage.setItem('nominalUang', nominalUang.toString());
    toast.success('Pengaturan berhasil disimpan');
    // Re-trigger calculation for any open 'add'/'edit' modal if settings change
    // This is complex. For now, just close. User might need to reopen to see effect.
    handleCloseModal();
  };

  const printColumns = [
    { header: 'Nama KK', accessor: 'nama_kk' },
    { header: 'Tanggungan', accessor: 'jumlah_tanggungan' },
    { header: 'Dibayar', accessor: 'jumlah_tanggunganyang_dibayar' },
    { header: 'Jenis Bayar', accessor: 'jenis_bayar' },
    { header: 'Beras', accessor: 'bayar_beras', cell: (row: BayarZakat) => (row.bayar_beras ? `${row.bayar_beras} kg` : '-') },
    { header: 'Uang', accessor: 'bayar_uang', cell: (row: BayarZakat) => formatCurrency(row.bayar_uang) },
    { header: 'Tanggal', accessor: 'created_at', cell: (row: BayarZakat) => formatDate(row.created_at) },
  ];

  const columns = [
    { header: 'Nama KK', accessor: 'nama_kk', sortable: true },
    { header: 'Tanggungan', accessor: 'jumlah_tanggungan', sortable: true },
    { header: 'Dibayar', accessor: 'jumlah_tanggunganyang_dibayar', sortable: true },
    { header: 'Jenis Bayar', accessor: 'jenis_bayar', sortable: true, cell: (row: BayarZakat) => <span className="capitalize">{row.jenis_bayar}</span> },
    { header: 'Beras', accessor: 'bayar_beras', sortable: true, cell: (row: BayarZakat) => <span>{row.bayar_beras ? `${row.bayar_beras} kg` : '-'}</span> },
    { header: 'Uang', accessor: 'bayar_uang', sortable: true, cell: (row: BayarZakat) => <span>{formatCurrency(row.bayar_uang)}</span> },
    { header: 'Tanggal', accessor: 'created_at', sortable: true, cell: (row: BayarZakat) => formatDate(row.created_at) },
    {
      header: 'Actions',
      accessor: (row: BayarZakat) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" icon={<Info size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('view', row); }} />
          <Button variant="ghost" size="sm" icon={<Edit size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('edit', row); }} />
          <Button variant="ghost" size="sm" icon={<Trash size={16} />} onClick={(e) => { e.stopPropagation(); handleOpenModal('delete', row); }} />
        </div>
      ),
    },
  ];

  const tanggunganDibayarForDisplay = jumlahTanggunganDibayar === undefined || jumlahTanggunganDibayar === null || isNaN(parseFloat(String(jumlahTanggunganDibayar)))
    ? 0
    : parseFloat(String(jumlahTanggunganDibayar));


  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Pembayaran Zakat Fitrah</h1>
        <div className="flex gap-2">
          <Button variant="outline" icon={<Settings size={16} />} onClick={() => handleOpenModal('settings')}>
            Pengaturan
          </Button>
          <Button variant="outline" icon={<FileDown size={16} />} onClick={handlePrint} disabled={zakatList.length === 0}>
            Ekspor PDF
          </Button>
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => handleOpenModal('add')}>
            Tambah Pembayaran
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <DataTable
            columns={columns}
            data={zakatList}
            keyField="id_zakat"
            isLoading={isLoading}
            emptyMessage="Tidak ada data pembayaran zakat yang tersedia"
            onRowClick={(row) => handleOpenModal('view', row)}
          />
        </CardContent>
      </Card>

      <div className="hidden">
        <div ref={printRef}>
          <PrintableTable title="Data Pembayaran Zakat" columns={printColumns} data={zakatList} keyField="id_zakat" />
        </div>
      </div>

      <Modal isOpen={openModal === 'settings'} onClose={handleCloseModal} title="Pengaturan Zakat">
        <div className="space-y-4">
          <Input
            label="Beras per Jiwa (kg)"
            type="number"
            step="0.1"
            value={berasPerJiwa}
            onChange={(e) => setBerasPerJiwa(parseFloat(e.target.value) || 0)}
          />
          <Input
            label="Nominal Uang per Jiwa (Rp)"
            type="number"
            value={nominalUang}
            onChange={(e) => setNominalUang(parseInt(e.target.value) || 0)}
          />
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
            <Button variant="primary" onClick={handleSaveSettings}>Simpan</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={openModal === 'add' || openModal === 'edit'}
        onClose={handleCloseModal}
        title={openModal === 'add' ? 'Tambah Pembayaran Zakat' : 'Edit Pembayaran Zakat'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nama Kepala Keluarga"
            placeholder="Masukkan nama kepala keluarga"
            error={errors.nama_kk?.message}
            {...register('nama_kk', { required: 'Nama kepala keluarga harus diisi' })}
          />
          <Input
            label="Jumlah Tanggungan (total jiwa dalam KK)"
            type="number"
            placeholder="Masukkan jumlah tanggungan"
            error={errors.jumlah_tanggungan?.message}
            {...register('jumlah_tanggungan', {
              required: 'Jumlah tanggungan harus diisi',
              valueAsNumber: true,
              min: { value: 0, message: 'Jumlah tanggungan tidak boleh negatif' },
            })}
          />
          <Input
            label="Jumlah Tanggungan yang Dibayar Zakatnya"
            type="number"
            placeholder="Masukkan jumlah jiwa yang dibayar zakatnya"
            error={errors.jumlah_tanggunganyang_dibayar?.message}
            {...register('jumlah_tanggunganyang_dibayar', {
              required: 'Jumlah tanggungan yang dibayar harus diisi',
              valueAsNumber: true,
              min: { value: 0, message: 'Jumlah yang dibayar tidak boleh negatif' },
              validate: value => (value !== undefined && jumlahTanggungan !== undefined && value > jumlahTanggungan) ? 'Jumlah yang dibayar tidak boleh melebihi total tanggungan' : true,
            })}
          />
          <RadioGroup
            label="Jenis Pembayaran"
            options={[
              { value: 'beras', label: 'Beras' },
              { value: 'uang', label: 'Uang' },
            ]}
            value={jenisBayar || 'beras'}
            onChange={(value) => setValue('jenis_bayar', value as 'beras' | 'uang', { shouldValidate: true })}
          />

          {jenisBayar === 'beras' && (
            <>
              <Input
                label="Total Beras Dibayar (kg)"
                type="number"
                step="0.1"
                placeholder="Total beras yang dibayar"
                error={errors.bayar_beras?.message}
                {...register('bayar_beras', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Jumlah beras tidak boleh negatif' },
                  validate: value => jenisBayar === 'beras' && (value === null || value === undefined || value <=0 && tanggunganDibayarForDisplay > 0) ? 'Total beras harus diisi jika membayar untuk tanggungan' : true,
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                Perhitungan otomatis: {berasPerJiwa} kg × {tanggunganDibayarForDisplay} jiwa = {(berasPerJiwa * tanggunganDibayarForDisplay).toFixed(1)} kg
              </p>
            </>
          )}

          {jenisBayar === 'uang' && (
            <>
              <Input
                label="Total Uang Dibayar (Rp)"
                type="number"
                placeholder="Total uang yang dibayar"
                error={errors.bayar_uang?.message}
                {...register('bayar_uang', {
                  valueAsNumber: true,
                  min: { value: 0, message: 'Jumlah uang tidak boleh negatif' },
                  validate: value => jenisBayar === 'uang' && (value === null || value === undefined || value <=0 && tanggunganDibayarForDisplay > 0) ? 'Total uang harus diisi jika membayar untuk tanggungan' : true,
                })}
              />
               <p className="text-xs text-gray-500 mt-1">
                Perhitungan otomatis: {formatCurrency(nominalUang)} × {tanggunganDibayarForDisplay} jiwa = {formatCurrency(nominalUang * tanggunganDibayarForDisplay)}
              </p>
            </>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" type="button" onClick={handleCloseModal}>
              Batal
            </Button>
            <Button variant="primary" type="submit">
              {openModal === 'add' ? 'Simpan' : 'Perbarui'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={openModal === 'view'} onClose={handleCloseModal} title="Detail Pembayaran Zakat">
        {selectedZakat && (
          <div className="space-y-3">
            <div><h3 className="text-sm font-medium text-gray-500">Nama KK</h3><p className="mt-1 text-base">{selectedZakat.nama_kk}</p></div>
            <div className="grid grid-cols-2 gap-4">
              <div><h3 className="text-sm font-medium text-gray-500">Total Tanggungan</h3><p className="mt-1 text-base">{selectedZakat.jumlah_tanggungan} jiwa</p></div>
              <div><h3 className="text-sm font-medium text-gray-500">Tanggungan Dibayar</h3><p className="mt-1 text-base">{selectedZakat.jumlah_tanggunganyang_dibayar} jiwa</p></div>
            </div>
            <div><h3 className="text-sm font-medium text-gray-500">Jenis Pembayaran</h3><p className="mt-1 text-base capitalize">{selectedZakat.jenis_bayar}</p></div>
            {selectedZakat.jenis_bayar === 'beras' && selectedZakat.bayar_beras !== null && (
              <div><h3 className="text-sm font-medium text-gray-500">Jumlah Beras</h3><p className="mt-1 text-base">{selectedZakat.bayar_beras} kg</p></div>
            )}
            {selectedZakat.jenis_bayar === 'uang' && selectedZakat.bayar_uang !== null && (
              <div><h3 className="text-sm font-medium text-gray-500">Jumlah Uang</h3><p className="mt-1 text-base">{formatCurrency(selectedZakat.bayar_uang)}</p></div>
            )}
            <div><h3 className="text-sm font-medium text-gray-500">Tgl. Pembayaran</h3><p className="mt-1 text-base">{formatDate(selectedZakat.created_at)}</p></div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={handleCloseModal}>Tutup</Button>
              <Button variant="primary" onClick={() => { handleCloseModal(); handleOpenModal('edit', selectedZakat); }}>Edit</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={openModal === 'delete'} onClose={handleCloseModal} title="Hapus Pembayaran Zakat">
        <p className="text-gray-600 mb-6">
          Apakah Anda yakin ingin menghapus pembayaran zakat dari <span className="font-medium">{selectedZakat?.nama_kk}</span>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={handleCloseModal}>Batal</Button>
          <Button variant="danger" onClick={handleDelete}>Hapus</Button>
        </div>
      </Modal>
    </div>
  );
};

export default BayarZakatPage;