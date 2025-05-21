import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import toast from 'react-hot-toast';

export const usePrint = (documentTitle: string) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle,
    onBeforeGetContent: () => {
      return new Promise((resolve) => {
        resolve();
      });
    },
    onPrintError: () => {
      toast.error('Gagal mengekspor PDF. Silakan coba lagi.');
    },
  });

  return { printRef, handlePrint };
};