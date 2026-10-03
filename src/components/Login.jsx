import { useState } from 'react';
import { signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase'; 

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // State untuk form update nama (opsional, hanya dipakai sekali)
  const [showUpdateName, setShowUpdateName] = useState(false);
  const [newName, setNewName] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Jika user belum punya Display Name, munculkan form update nama
      if (!userCredential.user.displayName) {
        setShowUpdateName(true);
        setLoading(false);
      } else {
        onLoginSuccess();
      }
      
    } catch (err) {
      setError('Email atau password salah!');
      setLoading(false);
    }
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile(auth.currentUser, {
        displayName: newName
      });
      // Setelah nama diupdate, arahkan ke halaman utama
      onLoginSuccess();
    } catch (error) {
      setError('Gagal menyimpan nama');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">KENDAL EV</h1>
          <p className="text-gray-500 text-sm mt-2">Silakan login untuk mencatat servis</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        {/* Jika belum punya nama, tampilkan form ini */}
        {showUpdateName ? (
          <form onSubmit={handleUpdateName} className="space-y-5">
             <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm text-center border border-blue-200">
                Login berhasil! Namun akun Anda belum memiliki Nama Montir. Silakan isi terlebih dahulu.
              </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama Montir / Mekanik</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Contoh: Agus"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors ${
                loading ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {loading ? 'Menyimpan...' : 'Simpan Nama & Masuk'}
            </button>
          </form>

        ) : (
          
          /* Form Login Biasa */
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="montir@bengkel.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 rounded-lg text-white font-semibold transition-colors ${
                loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}