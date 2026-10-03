import { useState, useEffect, useRef, useMemo } from 'react';
// Tambahkan 'where' pada import ini
import { collection, query, orderBy, where, getDocs } from 'firebase/firestore'; 
import { db } from '../firebase';
import { toPng } from 'html-to-image';

// Terima userEmail dari App.jsx
export default function History({ userEmail }) { 
  const [riwayat, setRiwayat] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [printingId, setPrintingId] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);

  useEffect(() => {
    const fetchRiwayat = async () => {
      try {
        // FILTER DATA: Hanya ambil yang emailnya cocok dengan user yang login
        const q = query(
          collection(db, 'transaksi_servis'), 
          where('userEmail', '==', userEmail), 
          orderBy('tanggal', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        
        const data = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setRiwayat(data);
      } catch (error) {
        console.error("Error mengambil data riwayat:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRiwayat();
  }, [userEmail]); // Tambahkan userEmail ke dependency array

  // ... --- SEMUA KODE DI BAWAH INI SAMA PERSIS SEPERTI SEBELUMNYA ---
  
  const ringkasan = useMemo(() => {
    let hariIni = 0;
    let bulanIni = 0;

    const waktuSekarang = new Date();
    const tglHariIni = waktuSekarang.toLocaleDateString('id-ID');
    const bulanSekarang = waktuSekarang.getMonth();
    const tahunSekarang = waktuSekarang.getFullYear();

    riwayat.forEach((item) => {
      if (!item.tanggal) return;
      const tglItem = new Date(item.tanggal.seconds * 1000);
      const biaya = item.totalBiaya || 0;
      if (tglItem.toLocaleDateString('id-ID') === tglHariIni) {
        hariIni += biaya;
      }
      if (tglItem.getMonth() === bulanSekarang && tglItem.getFullYear() === tahunSekarang) {
        bulanIni += biaya;
      }
    });

    return { hariIni, bulanIni };
  }, [riwayat]);

  const handleReprint = (item) => {
    setPrintingId(item.id);
    setReceiptData(item);

    setTimeout(async () => {
      if (receiptRef.current) {
        try {
          const dataUrl = await toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
          const res = await fetch(dataUrl);
          const blob = await res.blob();
          const file = new File([blob], `copy-struk-${item.pelanggan}.png`, { type: blob.type });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'Copy Struk Servis EV',
            });
          } else {
            alert('Fitur Share tidak didukung di browser ini.');
          }
        } catch (error) {
          console.error('Error saat cetak ulang:', error);
          alert('Gagal membuat gambar struk.');
        } finally {
          setPrintingId(null);
        }
      }
    }, 100); 
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-10 animate-pulse">Memuat data riwayat...</div>;
  }

  return (
    <div className="relative space-y-4">
      {/* Kartu Ringkasan */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wider mb-1">Pendapatan Hari Ini</p>
          <h2 className="text-lg font-bold text-gray-800">
            Rp {ringkasan.hariIni.toLocaleString('id-ID')}
          </h2>
        </div>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100">
          <p className="text-[11px] font-semibold text-green-600 uppercase tracking-wider mb-1">Pendapatan Bulan Ini</p>
          <h2 className="text-lg font-bold text-gray-800">
            Rp {ringkasan.bulanIni.toLocaleString('id-ID')}
          </h2>
        </div>
      </div>

      {riwayat.length === 0 && (
        <div className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border border-dashed">Belum ada data servis.</div>
      )}

      {/* Daftar Riwayat */}
      {riwayat.map((item) => (
        <div key={item.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-gray-800 text-lg">{item.pelanggan}</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {item.jenisKendaraan === 'motor' ? `Motor Listrik (${item.platNomor})` : 'Sepeda Listrik'}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-blue-600">Rp {item.totalBiaya?.toLocaleString('id-ID')}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {item.tanggal ? new Date(item.tanggal.seconds * 1000).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric'
                }) : 'Baru saja'}
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Rincian Perbaikan:</p>
            <ul className="text-sm text-gray-700 space-y-1">
              {item.items?.map((detail, idx) => (
                <li key={idx} className="flex justify-between">
                  <span>- {detail.nama} <span className="text-gray-400 text-xs">(x{detail.qty})</span></span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
            <button 
              onClick={() => handleReprint(item)}
              disabled={printingId === item.id}
              className={`text-xs flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-colors ${
                printingId === item.id 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
              }`}
            >
              {printingId === item.id ? 'Memproses...' : '🖨️️ Cetak Ulang'}
            </button>
          </div>
        </div>
      ))}

      {/* Template Struk Cetak Ulang */}
      {receiptData && (
        <div className="fixed -left-[9999px] top-0">
          <div ref={receiptRef} className="bg-white text-black p-4 w-[300px] font-mono text-sm">
            <div className="text-center border-b-2 border-black pb-2 mb-2">
              <h2 className="font-bold text-lg">KENDAL EV </h2>
              <p className="text-xs">Bengkel Kendaraan Listrik</p>
              <p className="text-xs">Telp: 0838-7622-9121 </p>
              <p className="text-[10px] mt-1 font-bold">* COPY / CETAK ULANG *</p>
            </div>
            
            <div className="text-xs mb-2 border-b border-dashed border-gray-400 pb-2">
              <p>Plg  : {receiptData.pelanggan}</p>
              <p>Tipe : {receiptData.jenisKendaraan === 'motor' ? 'Motor Listrik' : 'Sepeda Listrik'}</p>
              {receiptData.jenisKendaraan === 'motor' && (
                <p>Plat : {receiptData.platNomor}</p>
              )}
              <p>Tgl  : {receiptData.tanggal ? new Date(receiptData.tanggal.seconds * 1000).toLocaleDateString('id-ID') : '-'}</p>
              <p>Mek  : {receiptData.montir ? receiptData.montir : 'Admin'}</p>
            </div>

            <div className="min-h-[100px]">
              {receiptData.items?.map((item, i) => (
                <div key={i} className="text-xs mb-2">
                  <p className="font-bold">{item.nama}</p>
                  <div className="flex justify-between">
                    <span>{item.qty} x {item.harga?.toLocaleString('id-ID')}</span>
                    <span>{(item.qty * item.harga)?.toLocaleString('id-ID')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-black mt-2 pt-2 text-right">
              <p className="text-xs">Total Biaya:</p>
              <h3 className="font-bold text-lg">Rp {receiptData.totalBiaya?.toLocaleString('id-ID')}</h3>
            </div>
            
            <div className="text-center text-xs mt-4 pt-2">
              <p>Terima Kasih Atas</p>
              <p>Kunjungan Anda</p>
              <p className="text-[10px] mt-1 text-gray-500">Go Green! Save The Earth.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}