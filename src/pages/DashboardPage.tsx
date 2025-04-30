import React, { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import supabase from '../lib/supabase';
import { Database } from '../lib/database.types';
import { BarChart as BarChartIcon, Wallet, Users, CoinsIcon, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';

type ZakatStats = {
  totalMuzakki: number;
  totalMustahik: number;
  totalBerasCollected: number;
  totalUangCollected: number;
};

type ChartData = {
  collectionData: Array<{
    date: string;
    beras: number;
    uang: number;
  }>;
  distributionData: Array<{
    name: string;
    value: number;
  }>;
};

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<ZakatStats>({
    totalMuzakki: 0,
    totalMustahik: 0,
    totalBerasCollected: 0,
    totalUangCollected: 0,
  });
  const [chartData, setChartData] = useState<ChartData>({
    collectionData: [],
    distributionData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Laporan Zakat_${format(new Date(), 'dd-MM-yyyy')}`,
    onBeforeGetContent: () => {
      if (!reportRef.current) return;
      // Ensure charts are properly rendered before printing
      const charts = reportRef.current.querySelectorAll('.recharts-wrapper');
      charts.forEach(chart => {
        (chart as HTMLElement).style.width = '100%';
        (chart as HTMLElement).style.minHeight = '300px';
      });
    },
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm;
      }
      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Ambil statistik dasar
      const { count: muzakkiCount } = await supabase
        .from('muzakki')
        .select('*', { count: 'exact', head: true });

      const { count: mustahikWargaCount } = await supabase
        .from('mustahik_warga')
        .select('*', { count: 'exact', head: true });

      const { count: mustahikLainnyaCount } = await supabase
        .from('mustahik_lainnya')
        .select('*', { count: 'exact', head: true });

      // Ambil data pengumpulan zakat
      const { data: zakatData } = await supabase
        .from('bayarzakat')
        .select('*')
        .order('created_at', { ascending: true });

      // Proses data pengumpulan untuk grafik
      const collectionByDate = zakatData?.reduce((acc: any, curr) => {
        const date = format(new Date(curr.created_at), 'dd MMM', { locale: id });
        if (!acc[date]) {
          acc[date] = { beras: 0, uang: 0 };
        }
        if (curr.jenis_bayar === 'beras') {
          acc[date].beras += curr.bayar_beras || 0;
        } else {
          acc[date].uang += curr.bayar_uang || 0;
        }
        return acc;
      }, {});

      const collectionData = Object.entries(collectionByDate || {}).map(([date, values]: [string, any]) => ({
        date,
        beras: values.beras,
        uang: values.uang / 1000000, // Konversi ke juta
      }));

      // Ambil data distribusi
      const { data: kategoriData } = await supabase
        .from('kategori_mustahik')
        .select('nama_kategori, jumlah_hak');

      const distributionData = kategoriData?.map(kategori => ({
        name: kategori.nama_kategori,
        value: kategori.jumlah_hak
      })) || [];

      // Hitung total
      const totalBeras = zakatData?.reduce((sum, item) => sum + (item.bayar_beras || 0), 0) || 0;
      const totalUang = zakatData?.reduce((sum, item) => sum + (item.bayar_uang || 0), 0) || 0;

      setStats({
        totalMuzakki: muzakkiCount || 0,
        totalMustahik: (mustahikWargaCount || 0) + (mustahikLainnyaCount || 0),
        totalBerasCollected: totalBeras,
        totalUangCollected: totalUang,
      });

      setChartData({
        collectionData,
        distributionData,
      });
    } catch (error) {
      console.error('Error mengambil data dashboard:', error);
      toast.error('Gagal memuat data dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const StatCard = ({ title, value, icon: Icon, color, isLoading }: {
    title: string;
    value: string | number;
    icon: React.ElementType;
    color: string;
    isLoading: boolean;
  }) => (
    <motion.div variants={itemVariants}>
      <Card className="hover:translate-y-[-4px]">
        <CardContent className="p-6">
          <div className="flex items-center">
            <div className={`rounded-full p-3 ${color} mr-4`}>
              <Icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{title}</p>
              {isLoading ? (
                <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1"></div>
              ) : (
                <p className="text-2xl font-semibold mt-1">{value}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <motion.h1 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold text-gray-800"
        >
          Beranda
        </motion.h1>
        <Button
          variant="primary"
          icon={<FileDown size={16} />}
          onClick={handlePrint}
          className="no-print"
        >
          Ekspor PDF
        </Button>
      </div>

      <div ref={reportRef} className="space-y-6">
        {/* Report Header */}
        <div className="text-center print:block hidden mb-8">
          <h1 className="text-2xl font-bold">Laporan Zakat Fitrah</h1>
          <p className="text-gray-600 mt-2">
            Periode: {format(new Date(), 'dd MMMM yyyy', { locale: id })}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Jumlah Muzakki"
            value={stats.totalMuzakki}
            icon={Users}
            color="bg-primary-50 text-primary-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Jumlah Mustahik"
            value={stats.totalMustahik}
            icon={BarChartIcon}
            color="bg-secondary-50 text-secondary-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Beras"
            value={`${stats.totalBerasCollected.toFixed(1)} kg`}
            icon={Wallet}
            color="bg-accent-50 text-accent-600"
            isLoading={isLoading}
          />
          <StatCard
            title="Total Uang"
            value={formatCurrency(stats.totalUangCollected)}
            icon={CoinsIcon}
            color="bg-success-50 text-success-600"
            isLoading={isLoading}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-800">Pengumpulan Zakat Fitrah</h2>
              <p className="text-sm text-gray-600 mt-1">
                Tren pengumpulan zakat berdasarkan waktu dan jenis pembayaran
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse" />
              ) : (
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData.collectionData}
                      margin={{
                        top: 20,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis yAxisId="left" label={{ value: 'Beras (kg)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Uang (juta)', angle: 90, position: 'insideRight' }} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="beras" fill="#10B981" name="Beras (kg)" />
                      <Bar yAxisId="right" dataKey="uang" fill="#3B82F6" name="Uang (juta)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold text-gray-800">Distribusi Zakat Fitrah</h2>
              <p className="text-sm text-gray-600 mt-1">
                Perbandingan distribusi berdasarkan kategori mustahik
              </p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-[300px] bg-gray-50 rounded-lg animate-pulse" />
              ) : (
                <div className="w-full h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData.distributionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      >
                        {chartData.distributionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;