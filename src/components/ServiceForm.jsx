import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toPng } from 'html-to-image';

export default function ServiceForm({ userName, userEmail }) {
  const [pelanggan, setPelanggan] = useState('');
  const [jenisKendaraan, setJenisKendaraan] = useState('motor'); // Default: motor
  const [platNomor, setPlatNomor] = useState('');
  const [items, setItems] = useState([{ nama: '', harga: 0, qty: 1 }]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const receiptRef = useRef(null);

  const handleAddItem = () => {
    setItems([...items, { nama: '', harga: 0, qty: 1 }]);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const totalBiaya = items.reduce((total, item) => total + (item.harga * item.qty), 0);

  const handleSaveAndPrint = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    const platFinal = jenisKendaraan === 'motor' ? platNomor : '-';

    try {
      // 2. Tambahkan kolom userEmail di penyimpanan data
      await addDoc(collection(db, 'transaksi_servis'), {
        pelanggan,
        jenisKendaraan,
        platNomor: platFinal,
        items,
        totalBiaya,
        montir: userName,
        userEmail: userEmail,
        tanggal: serverTimestamp()
      });

      // 2. Ubah HTML Struk menjadi Gambar
      if (receiptRef.current) {
        const dataUrl = await toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        const file = new File([blob], 'struk-servis.png', { type: blob.type });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Struk Servis EV',
          });
        } else {
          alert('Fitur Share (Cetak) tidak didukung di browser ini.');
        }
      }

      // 3. Reset Form
      setPelanggan('');
      setJenisKendaraan('motor');
      setPlatNomor('');
      setItems([{ nama: '', harga: 0, qty: 1 }]);
      alert('Data berhasil disimpan!');

    } catch (error) {
      console.error('Error:', error);
      alert('Terjadi kesalahan saat memproses data.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative">
      <form onSubmit={handleSaveAndPrint} className="space-y-4">
        
        {/* Pilihan Jenis Kendaraan */}
        <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <label className="block text-xs font-medium text-gray-500 mb-2">Jenis Kendaraan EV</label>
          <div className="flex gap-4">
            <label className="flex items-center text-sm font-medium cursor-pointer">
              <input 
                type="radio" 
                value="motor" 
                checked={jenisKendaraan === 'motor'} 
                onChange={() => setJenisKendaraan('motor')} 
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
              /> 
              Motor Listrik
            </label>
            <label className="flex items-center text-sm font-medium cursor-pointer">
              <input 
                type="radio" 
                value="sepeda" 
                checked={jenisKendaraan === 'sepeda'} 
                onChange={() => {
                  setJenisKendaraan('sepeda');
                  setPlatNomor(''); // Kosongkan plat saat beralih ke sepeda
                }} 
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300" 
              /> 
              Sepeda Listrik
            </label>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={jenisKendaraan === 'sepeda' ? "col-span-2" : "col-span-1"}>
            <label className="block text-xs font-medium text-gray-500 mb-1">Nama Pelanggan</label>
            <input type="text" required value={pelanggan} onChange={(e) => setPelanggan(e.target.value)} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="Contoh: Budi" />
          </div>
          
          {/* Form Plat Nomor otomatis hilang/muncul berdasarkan pilihan jenis kendaraan */}
          {jenisKendaraan === 'motor' && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plat Nomor</label>
              <input type="text" required value={platNomor} onChange={(e) => setPlatNomor(e.target.value.toUpperCase())} className="w-full px-3 py-2 border rounded-lg text-sm" placeholder="H 1234 AB" />
            </div>
          )}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-bold text-gray-700 mb-2">Daftar Servis / Sparepart</h3>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2 items-start mb-2 bg-gray-50 p-2 rounded-lg border">
              <div className="flex-1 space-y-2">
                <input type="text" placeholder="Ganti Controller / Dinamo" required value={item.nama} onChange={(e) => handleItemChange(index, 'nama', e.target.value)} className="w-full px-2 py-1.5 border rounded text-sm" />
                <div className="flex gap-2">
                  <input type="number" placeholder="Harga" required min="0" value={item.harga || ''} onChange={(e) => handleItemChange(index, 'harga', Number(e.target.value))} className="w-full px-2 py-1.5 border rounded text-sm" />
                  <input type="number" placeholder="Qty" required min="1" value={item.qty} onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))} className="w-16 px-2 py-1.5 border rounded text-sm text-center" />
                </div>
              </div>
              {items.length > 1 && (
                <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-500 p-2">✕</button>
              )}
            </div>
          ))}
          <button type="button" onClick={handleAddItem} className="text-sm text-blue-600 font-medium mt-2">+ Tambah Baris</button>
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <span className="font-bold text-gray-700">Total:</span>
          <span className="font-bold text-xl text-blue-600">Rp {totalBiaya.toLocaleString('id-ID')}</span>
        </div>

        <button type="submit" disabled={isProcessing} className={`w-full py-3 mt-4 rounded-lg text-white font-bold shadow-md ${isProcessing ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}>
          {isProcessing ? 'Memproses...' : 'Simpan & Cetak Struk'}
        </button>
      </form>


      {/* --- TEMPLATE STRUK --- */}
      <div className="fixed -left-[9999px] top-0">
        <div ref={receiptRef} className="bg-white text-black p-4 w-[300px] font-mono text-sm">
          <div className="text-center border-b-2 border-black pb-2 mb-2">
            <h2 className="font-bold text-lg">KENDAL EV </h2>
            <p className="text-xs">Bengkel Kendaraan Listrik</p>
            <p className="text-xs">Telp: 0838-7622-9121</p>
          </div>
          
          <div className="text-xs mb-2 border-b border-dashed border-gray-400 pb-2">
            <p>Plg  : {pelanggan}</p>
            <p>Tipe : {jenisKendaraan === 'motor' ? 'Motor Listrik' : 'Sepeda Listrik'}</p>
            {/* Tampilkan Plat Nomor HANYA jika jenisnya motor */}
            {jenisKendaraan === 'motor' && (
              <p>Plat : {platNomor}</p>
            )}
            <p>Tgl  : {new Date().toLocaleDateString('id-ID')}</p>
            <p>Mek  : {userName}</p>
          </div>

          <div className="min-h-[100px]">
            {items.map((item, i) => (
              <div key={i} className="text-xs mb-2">
                <p className="font-bold">{item.nama}</p>
                <div className="flex justify-between">
                  <span>{item.qty} x {item.harga.toLocaleString('id-ID')}</span>
                  <span>{(item.qty * item.harga).toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-black mt-2 pt-2 text-right">
            <p className="text-xs">Total Biaya:</p>
            <h3 className="font-bold text-lg">Rp {totalBiaya.toLocaleString('id-ID')}</h3>
          </div>
          
          <div className="text-center text-xs mt-4 pt-2">
            <p>Terima Kasih Atas</p>
            <p>Kunjungan Anda</p>
            <p className="text-[10px] mt-1 text-gray-500">Go Green! Save The Earth.</p>
          </div>
        </div>
      </div>
    </div>
  );
}