import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, Lock, Globe, Share2, Shield, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';



export function UploadPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tags, setTags] = useState<string>('');

  // Privacy State
  const [visibility, setVisibility] = useState<'private' | 'shared' | 'public'>('private');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles?.[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!file) return;

    // Validate PIN
    if ((visibility === 'private' || visibility === 'shared') && pin) {
      if (pin !== confirmPin) {
        toast.error('PINs do not match');
        return;
      }
      if (pin.length < 4) {
        toast.error('PIN must be at least 4 digits');
        return;
      }
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name);
    // Determine type based on mime
    const type = file.type.startsWith('image/') ? 'image' :
      file.type.startsWith('video/') ? 'video' :
        file.type.startsWith('audio/') ? 'audio' : 'document';
    formData.append('type', type);

    // Size string
    const size = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
    formData.append('size', size);

    // Tags
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    formData.append('tags', JSON.stringify(tagArray));

    // Privacy
    formData.append('visibility', visibility);
    if (pin) {
      formData.append('pin', pin);
    }

    try {
      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 10;
        });
      }, 200);

      const res = await fetch('http://localhost:5000/api/assets/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      clearInterval(interval);
      setProgress(100);

      if (res.ok) {
        toast.success('File uploaded successfully!');
        setTimeout(() => navigate('/home'), 500);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      toast.error('Failed to upload file');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Asset</h1>
        <p className="text-gray-500">Add secure files to your vault</p>
      </div>

      <div className="grid gap-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all duration-300
            ${isDragActive ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'}
            ${file ? 'bg-purple-50 border-purple-500' : 'bg-white'}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${file ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-700">Drag & drop or click to upload</p>
                <p className="text-sm text-gray-400 mt-1">Supports Image, Video, Audio, Docs</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Options */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Tags (Mandatory)</Label>
            <Input
              id="asset-tags"
              name="asset-tags"
              autoComplete="off"
              placeholder="nature, project, secret (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-900">Privacy Settings</h3>
            </div>

            {/* Visibility Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div
                onClick={() => setVisibility('private')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${visibility === 'private' ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200 hover:border-purple-200'}`}
              >
                <div className="flex flex-col gap-2">
                  <Lock className={`w-6 h-6 ${visibility === 'private' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Private</span>
                  <span className="text-xs text-gray-500">Only you can see this. PIN optional.</span>
                </div>
              </div>

              <div
                onClick={() => setVisibility('shared')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${visibility === 'shared' ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-200'}`}
              >
                <div className="flex flex-col gap-2">
                  <Share2 className={`w-6 h-6 ${visibility === 'shared' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Shared</span>
                  <span className="text-xs text-gray-500">Accessible via secure link.</span>
                </div>
              </div>

              <div
                onClick={() => setVisibility('public')}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${visibility === 'public' ? 'border-green-500 bg-green-50 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-200'}`}
              >
                <div className="flex flex-col gap-2">
                  <Globe className={`w-6 h-6 ${visibility === 'public' ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className="font-medium">Public</span>
                  <span className="text-xs text-gray-500">Anyone can find and view.</span>
                </div>
              </div>
            </div>

            {/* PIN Settings (Only for Private/Shared) */}
            <AnimatePresence>
              {(visibility === 'private' || visibility === 'shared') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-gray-50 p-4 rounded-xl space-y-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span className="font-medium text-sm text-gray-700">Encryption PIN (Optional for Private)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Set PIN</Label>
                      <Input
                        id="asset-pin"
                        name="asset-pin"
                        autoComplete="new-password"
                        type="password"
                        placeholder="Enter secure PIN"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Confirm PIN</Label>
                      <Input
                        id="asset-confirm-pin"
                        name="asset-confirm-pin"
                        autoComplete="new-password"
                        type="password"
                        placeholder="Repeat PIN"
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value)}
                        maxLength={6}
                      />
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                    <AlertCircle className="w-4 h-4 mt-0.5" />
                    <p>If set, this PIN will be required to open, download, or delete this file. Don't forget it!</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>

        {/* Upload Button */}
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => { setFile(null); setPin(''); }}>Cancel</Button>
          <Button
            onClick={handleUpload}
            className="bg-purple-600 hover:bg-purple-700 min-w-[150px]"
            disabled={uploading || !file ? true : false}
          >
            {uploading ? 'Uploading...' : 'Secure Upload'}
          </Button>
        </div>

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Encrypting & Uploading...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
