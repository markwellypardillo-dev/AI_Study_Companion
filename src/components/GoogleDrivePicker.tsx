import React, { useState, useEffect } from 'react';
import { X, FileText, Loader2, HardDrive } from 'lucide-react';
import { getAccessToken, initAuth, googleSignIn } from '../lib/firebase';

interface GoogleDrivePickerProps {
  onFileSelected: (file: File) => void;
  onClose: () => void;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
}

export default function GoogleDrivePicker({ onFileSelected, onClose }: GoogleDrivePickerProps) {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [needsAuth, setNeedsAuth] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setNeedsAuth(false);
        fetchFiles(token);
      },
      () => setNeedsAuth(true)
    );
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setNeedsAuth(false);
        fetchFiles(result.accessToken);
      }
    } catch (err) {
      console.error('Login failed:', err);
      setError('Failed to sign in to Google Drive.');
    }
  };

  const fetchFiles = async (token: string) => {
    setLoading(true);
    setError('');
    try {
      // Fetch PDFs and documents
      const query = "mimeType='application/pdf' or mimeType='text/plain' or mimeType='application/vnd.google-apps.document'";
      const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType)&pageSize=50`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch files from Drive');
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Could not load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (file: DriveFile) => {
    setDownloadingId(file.id);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Not authenticated');

      let url = `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`;
      
      // If it's a Google Doc, we need to export it instead of downloading alt=media
      if (file.mimeType === 'application/vnd.google-apps.document') {
        url = `https://www.googleapis.com/drive/v3/files/${file.id}/export?mimeType=application/pdf`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to download file');
      
      const blob = await res.blob();
      
      // Make sure to pass a filename that ends in .pdf for google docs
      const finalName = file.mimeType === 'application/vnd.google-apps.document' 
          ? `${file.name}.pdf` 
          : file.name;
          
      const fileObj = new File([blob], finalName, { type: blob.type });
      onFileSelected(fileObj);

    } catch (err) {
      console.error('Download error:', err);
      setError('Could not download the file.');
      setDownloadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-ios-light-bg dark:bg-ios-dark-bg border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-xl flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2 dark:text-white">
            <HardDrive className="w-5 h-5 text-brand-indigo" />
            Google Drive
          </h3>
          <button onClick={onClose} className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition">
            <X className="w-4 h-4 text-zinc-500" />
          </button>
        </div>

        {needsAuth ? (
          <div className="flex flex-col items-center justify-center py-10">
            <p className="text-zinc-600 dark:text-zinc-400 mb-6 text-center text-sm">
              Sign in with Google to browse and select files directly from your Drive.
            </p>
            <button onClick={handleLogin} className="gsi-material-button w-full">
              <div className="gsi-material-button-state"></div>
              <div className="gsi-material-button-content-wrapper flex items-center justify-center bg-white border border-zinc-300 rounded-lg px-4 py-2 hover:bg-zinc-50 shadow-sm transition">
                <div className="gsi-material-button-icon mr-3">
                  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-5 h-5 block">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                    <path fill="none" d="M0 0h48v48H0z"></path>
                  </svg>
                </div>
                <span className="text-sm font-medium text-zinc-700">Sign in with Google</span>
              </div>
            </button>
          </div>
        ) : (
          <>
            {error && <div className="p-3 mb-4 text-xs text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400">{error}</div>}
            
            <div className="flex-1 overflow-y-auto pr-1 space-y-2">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-brand-indigo" />
                  <p className="text-sm">Loading files...</p>
                </div>
              ) : files.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 text-sm">
                  No documents found in your Google Drive.
                </div>
              ) : (
                files.map((file) => (
                  <button
                    key={file.id}
                    onClick={() => handleFileSelect(file)}
                    disabled={downloadingId !== null}
                    className="w-full text-left p-3 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 flex items-center gap-3 group"
                  >
                    <div className="p-2 bg-brand-indigo/10 text-brand-indigo rounded-lg group-hover:bg-brand-indigo group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="text-sm font-medium text-zinc-900 dark:text-white truncate">{file.name}</h4>
                      <p className="text-[10px] text-zinc-500">Google Drive Document</p>
                    </div>
                    {downloadingId === file.id && (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-indigo" />
                    )}
                  </button>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
