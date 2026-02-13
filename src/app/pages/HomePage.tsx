import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  File,
  Image,
  Video,
  Music,
  FileText,
  Download,
  Trash2,
  Share2,
  ExternalLink,
  Search,
  Grid,
  List,
  Lock,
  Globe,
  Link as LinkIcon,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';

interface Asset {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: string;
  uploadDate: string;
  tags: string[];
  url: string;
  visibility: 'private' | 'shared' | 'public';
  hasPin: boolean;
  shareToken?: string;
}

export function HomePage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');

  // PIN Modal State
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [actionType, setActionType] = useState<'open' | 'download' | null>(null);
  const [verifying, setVerifying] = useState(false);



  useEffect(() => {
    if (token) {
      fetch('http://localhost:5000/api/assets', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => setAssets(data))
        .catch(() => toast.error('Failed to load assets'));
    }
  }, [token]);

  const handleDelete = async (asset: Asset) => {
    // If PIN protected, ask for it (Simple prompt for now, could be a Modal)
    let pinHeaders = {};
    if (asset.hasPin) {
      const pin = prompt('Enter PIN to delete this private asset:');
      if (!pin) return;
      pinHeaders = { 'x-asset-pin': pin };
    } else {
      if (!confirm('Are you sure you want to delete this asset?')) return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          ...pinHeaders
        },
      });

      if (res.ok) {
        setAssets(assets.filter((a) => a.id !== asset.id));
        toast.success('Asset deleted successfully');
      } else {
        const msg = await res.text();
        toast.error(`Failed to delete: ${msg}`);
      }
    } catch (error) {
      toast.error('Failed to delete asset');
    }
  };

  const handleShare = async (asset: Asset) => {
    try {
      const res = await fetch(`http://localhost:5000/api/assets/${asset.id}/share`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.shareToken) {
        const link = `${window.location.origin}/share/${data.shareToken}`;
        navigator.clipboard.writeText(link);
        toast.success('Share link copied to clipboard!');

        // Update local state
        setAssets(assets.map(a => a.id === asset.id ? { ...a, visibility: 'shared', shareToken: data.shareToken } : a));
      }
    } catch (err) {
      toast.error('Failed to generate share link');
    }
  };

  const handleActionClick = (asset: Asset, type: 'open' | 'download') => {
    if (!asset.url || asset.url === '#') {
      toast.info('Asset URL not available');
      return;
    }

    if (asset.hasPin) {
      setSelectedAsset(asset);
      setActionType(type);
      setPinInput('');
      setPinModalOpen(true);
    } else {
      // Direct action if no PIN
      if (type === 'open') performOpen(asset);
      else performDownload(asset);
    }
  };

  const performOpen = (asset: Asset) => {
    window.open(asset.url, '_blank');
  };

  const performDownload = (asset: Asset) => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Download started');
  };

  const verifyAndProceed = async () => {
    if (!selectedAsset) return;
    setVerifying(true);

    try {
      const res = await fetch(`http://localhost:5000/api/assets/${selectedAsset.id}/verify-pin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ pin: pinInput })
      });

      if (!res.ok) {
        if (res.status === 403) toast.error('Invalid PIN');
        else toast.error('Verification failed');
        setVerifying(false);
        return;
      }

      // Success
      setPinModalOpen(false);
      toast.success('Access Granted');

      if (actionType === 'open') performOpen(selectedAsset);
      else if (actionType === 'download') performDownload(selectedAsset);

    } catch (err) {
      toast.error('Server error during verification');
    } finally {
      setVerifying(false);
    }
  };


  // Stats Calculation
  const stats = {
    total: assets.length,
    images: assets.filter(a => a.type === 'image').length,
    videos: assets.filter(a => a.type === 'video').length,
    audio: assets.filter(a => a.type === 'audio').length,
    documents: assets.filter(a => a.type === 'document').length,
  };

  const getFileIcon = (type: string, size: string = "w-8 h-8") => {
    switch (type) {
      case 'image': return <Image className={size} />;
      case 'video': return <Video className={size} />;
      case 'audio': return <Music className={size} />;
      case 'document': return <FileText className={size} />;
      default: return <File className={size} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'image': return 'from-blue-500 to-cyan-500';
      case 'video': return 'from-emerald-400 to-teal-500';
      case 'audio': return 'from-green-500 to-emerald-500';
      case 'document': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'private': return <Lock className="w-3 h-3" />;
      case 'shared': return <LinkIcon className="w-3 h-3" />;
      case 'public': return <Globe className="w-3 h-3" />;
      default: return <Lock className="w-3 h-3" />;
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-8">
      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-purple-100 text-sm font-medium mb-1">Total Assets</p>
              <h3 className="text-4xl font-bold">{stats.total}</h3>
            </div>
            <File className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="bg-gradient-to-br from-blue-400 to-cyan-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-medium mb-1">Images</p>
              <h3 className="text-4xl font-bold">{stats.images}</h3>
            </div>
            <Image className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-emerald-100 text-sm font-medium mb-1">Videos</p>
              <h3 className="text-4xl font-bold">{stats.videos}</h3>
            </div>
            <Video className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {/* Split card for Audio & Docs if needed, or just list them. 
                The screenshot showed 4 cards: Total, Images, Audios, Videos. Docs was below or separate? 
                Actually screenshot has: Total(Purple), Images(Blue), Audios(Green), Videos(Teal). 
                And a separate Documents(Orange) card below? 
                Let's stick to a 4-column layout layout and maybe put Audio/Docs together or just list all types.
                Wait, the user wants "like above picture". 
                I will add Audio and Document cards. 
            */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-orange-100 text-sm font-medium mb-1">Documents</p>
              <h3 className="text-4xl font-bold">{stats.documents}</h3>
            </div>
            <FileText className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          </div>
        </motion.div>
        {/* If we have audio, maybe a 5th card or handle layout? 
             I'll push Audio to the next row or fit it in. 
             Actually, let's just render all 5 types if they exist, or standard 4. 
             I'll add Audio as a card too.
         */}
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden w-full md:w-1/4">
          <div className="relative z-10">
            <p className="text-green-100 text-sm font-medium mb-1">Audios</p>
            <h3 className="text-4xl font-bold">{stats.audio}</h3>
          </div>
          <Music className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
        </div>
      </motion.div>


      {/* Search & Actions Bar */}
      <div className="bg-white rounded-full shadow-sm border border-gray-100 p-2 pl-6 pr-2 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex-1 w-full md:w-auto flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search assets by name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-0 bg-transparent focus-visible:ring-0 px-0 placeholder:text-gray-400 h-10 w-full"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <Button
            variant={filterType === 'all' ? 'default' : 'ghost'}
            onClick={() => setFilterType('all')}
            className="rounded-full"
          >
            All
          </Button>
          {['image', 'video', 'document', 'audio'].map(type => (
            <Button
              key={type}
              variant={filterType === type ? 'secondary' : 'ghost'}
              onClick={() => setFilterType(type)}
              className={`capitalize rounded-full gap-2 ${filterType === type ? 'bg-gray-100' : 'text-gray-500'}`}
            >
              {getFileIcon(type, "w-4 h-4")}
              {type === 'document' ? 'Docs' : type + 's'}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-purple-100 text-purple-600 rounded-lg' : 'text-gray-400'}
          >
            <Grid className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-purple-100 text-purple-600 rounded-lg' : 'text-gray-400'}
          >
            <List className="w-4 h-4" />
          </Button>

          <Button
            className="rounded-full bg-purple-600 hover:bg-purple-700 px-6 ml-2"
            onClick={() => navigate('/upload')}
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Asset
          </Button>
        </div>
      </div>


      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <File className="w-8 h-8 text-purple-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">No assets found</h3>
          <p className="text-gray-500">Upload something to get started</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
          {filteredAssets.map((asset, index) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-sm bg-white rounded-3xl">
                {/* Preview Area - Large & Colorful */}
                <div className={`aspect-[4/3] bg-gradient-to-br ${getTypeColor(asset.type)} relative flex items-center justify-center`}>

                  {/* Center Icon */}
                  <div className="text-white/90 drop-shadow-md transform group-hover:scale-110 transition-transform duration-300">
                    {getFileIcon(asset.type, "w-16 h-16")}
                  </div>

                  {/* Visibility Badge */}
                  <div className="absolute top-4 right-4">
                    {asset.visibility !== 'public' && (
                      <div className="bg-black/20 backdrop-blur-md rounded-full p-1.5 text-white/80" title={asset.visibility}>
                        {getVisibilityIcon(asset.visibility)}
                      </div>
                    )}
                  </div>

                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                    <Button size="icon" className="rounded-full bg-white text-gray-900 hover:bg-gray-100" onClick={() => handleActionClick(asset, 'open')}>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="rounded-full bg-white text-gray-900 hover:bg-gray-100" onClick={() => handleActionClick(asset, 'download')}>
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="icon" className="rounded-full bg-white text-gray-900 hover:bg-gray-100" onClick={() => handleShare(asset)}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-900 truncate flex-1 pr-2 text-lg" title={asset.name}>
                      {asset.name}
                    </h3>
                    {/* Delete only on hover or keep visible? Styling suggests minimal. 
                         I'll add delete as a small subtle button or put it in overlay? 
                         Let's keep it visible but subtle. 
                     */}
                    <button
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      onClick={(e) => { e.stopPropagation(); handleDelete(asset); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="font-medium bg-gray-50 px-2 py-1 rounded-md">{asset.size}</span>
                    <span>{asset.uploadDate}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* PIN Verification Modal */}
      <Dialog open={pinModalOpen} onOpenChange={setPinModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="flex flex-col items-center gap-4 py-4">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 mb-2">
              <Lock className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl text-center">Protected File</DialogTitle>
            <p className="text-center text-gray-500 text-sm">
              Enter PIN to access this file
            </p>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-2 px-4">
            <Input
              id="pin-modal-input"
              name="pin-modal-input"
              autoComplete="new-password"
              type="password"
              className="text-center text-lg tracking-widest h-12 bg-gray-50 border-gray-200 focus-visible:ring-purple-500"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && verifyAndProceed()}
              maxLength={6}
              autoFocus
            />
          </div>

          <DialogFooter className="sm:justify-center flex-col gap-2 w-full px-4 pb-4">
            <Button
              className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-12 text-md font-medium"
              onClick={verifyAndProceed}
              disabled={verifying || !pinInput}
            >
              {verifying ? 'Verifying...' : `Unlock & ${actionType === 'download' ? 'Download' : 'Open'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
