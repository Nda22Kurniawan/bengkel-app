import { useState, useEffect } from 'react';
import { onAuthStateChanged, signOut, updateProfile } from 'firebase/auth'; // Pastikan updateProfile diimpor
import { auth } from './firebase';
import Login from './components/Login';
import ServiceForm from './components/ServiceForm';
import History from './components/History';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('kasir');

  // State khusus untuk form nama montir
  const [showNameForm, setShowNameForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      
      // JIKA USER LOGIN TAPI BELUM PUNYA NAMA, MUNCULKAN FORM
      if (currentUser && !currentUser.displayName) {
        setShowNameForm(true);
      } else {
        setShowNameForm(false);
      }
      
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Gagal logout:", error);
    }
  };

  // Fungsi untuk menyimpan nama ke Firebase
  const handleSaveName = async (e) => {
    e.preventDefault();
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: newName });
      // Perbarui state lokal agar aplikasi langsung memuat Dashboard tanpa perlu refresh
      setUser({ ...auth.currentUser, displayName: newName });
      setShowNameForm(false);
    } catch (error) {
      alert('Gagal menyimpan nama');
    } finally {
      setSavingName(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-gray-500">Memuat aplikasi...</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={() => console.log('Login berhasil!')} />;
  }

  // --- LAYAR PENCEGATAN: WAJIB ISI NAMA ---
  if (showNameForm) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md text-center">
          <h2 className="text-xl font-bold text-gray-800 mb-2">Selamat Datang!</h2>
          <p className="text-sm text-gray-500 mb-6">Silakan masukkan nama Anda (Montir) yang akan dicetak di struk pelanggan.</p>
          <form onSubmit={handleSaveName} className="space-y-4">
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Contoh: Agus"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={savingName}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
            >
              {savingName ? 'Menyimpan...' : 'Simpan & Lanjutkan'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- LAYAR UTAMA (DASHBOARD) ---
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-5">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">KENDAL EV</h1>
            {/* Sekarang memanggil user.displayName */}
            <p className="text-[10px] text-gray-400 uppercase tracking-wider">Montir: {user.displayName}</p>
          </div>
          <button 
            onClick={handleLogout}
            className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 font-medium"
          >
            Logout
          </button>
        </div>

        {/* Navigasi Tab */}
        <div className="flex space-x-2 mb-6 bg-gray-50 p-1 rounded-lg border border-gray-100">
          <button 
            onClick={() => setActiveTab('kasir')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'kasir' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500'
            }`}
          >
            Kasir Baru
          </button>
          <button 
            onClick={() => setActiveTab('riwayat')}
            className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
              activeTab === 'riwayat' ? 'bg-white text-blue-600 shadow-sm border border-gray-200' : 'text-gray-500'
            }`}
          >
            Riwayat
          </button>
        </div>
        
        {/* Konten Tab */}
        {activeTab === 'kasir' ? (
          // Tambahkan userEmail ke ServiceForm
          <ServiceForm userName={user.displayName} userEmail={user.email} />
        ) : (
          // Tambahkan userEmail ke History
          <History userEmail={user.email} />
        )}
        
      </div>
    </div>
  );
}

export default App;