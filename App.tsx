
import React, { useState, useEffect } from 'react';
import { User, Requisition, UserRole, RequestStatus, Product, StockTransaction, GithubConfig } from './types';
import { BLOOD_GROUPS } from './constants';
import { Layout } from './components/Layout';
import { analyzeStatistics } from './services/geminiService';
import { api } from './services/api'; // NEW API IMPORT
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Check, X, Clock, Loader2, Sparkles, AlertCircle, PlusCircle, Trash2, Building, Key, User as UserIcon, Pencil, Save, Package, Scale, Download, ListFilter, Droplet, Eye, EyeOff, Settings, Send, Warehouse, ArrowUpRight, ArrowDownLeft, Filter, Search, Github, CloudUpload, CloudDownload, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// --- TYPES LOCAL ---
interface TelegramConfig {
  botToken: string;
  chatId: string;
}

// --- SHARED LOADER COMPONENT ---
const LoadingOverlay = () => (
  <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center backdrop-blur-sm">
    <div className="bg-white p-4 rounded-xl shadow-xl flex items-center space-x-3 border border-blue-100">
      <Loader2 className="animate-spin text-blue-600" size={24} />
      <span className="font-medium text-slate-700">Ma'lumotlar yuklanmoqda...</span>
    </div>
  </div>
);

// 1. LOGIN PAGE
const LoginPage = ({ onLogin, loading }: { onLogin: (u: string, p: string) => void, loading: boolean }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Iltimos, barcha maydonlarni to\'ldiring.');
      return;
    }
    onLogin(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Taminot<span className="text-blue-600">Manager</span></h1>
          <p className="text-slate-500 mt-2">Tizimga kirish</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center">
              <AlertCircle size={16} className="mr-2" /> {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
            <input
              type="password"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition shadow-md hover:shadow-lg flex justify-center items-center"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ... (EditRequestModal, EditUserModal, EditProductModal, AdminDashboard, AdminWarehouse, AdminStats, OrgWarehouse, OrgStats, AdminUsers, AdminProducts - UNCHANGED)
// For brevity, skipping repeated components. They remain exactly as in the original file.

// 1.1 EDIT REQUEST MODAL
const EditRequestModal = ({ 
  request, 
  products,
  onClose, 
  onSave 
}: { 
  request: Requisition, 
  products: Product[],
  onClose: () => void, 
  onSave: (r: Requisition) => void 
}) => {
  const [quantity, setQuantity] = useState(request.quantity);
  const [productId, setProductId] = useState(request.productId);
  const [variant, setVariant] = useState(request.variant || '');
  const [bloodGroup, setBloodGroup] = useState(request.bloodGroup || BLOOD_GROUPS[0]);
  const [patientName, setPatientName] = useState(request.patientName || '');
  const [comment, setComment] = useState(request.comment || '');

  const selectedProductObj = products.find(p => p.id === productId);

  // Update variant when product changes
  useEffect(() => {
    if (selectedProductObj && selectedProductObj.variants && selectedProductObj.variants.length > 0) {
      if (!selectedProductObj.variants.includes(variant)) {
        setVariant(selectedProductObj.variants[0]);
      }
    } else {
      setVariant('');
    }
  }, [productId, products]);

  const handleSave = () => {
    if (!selectedProductObj) return;

    onSave({
      ...request,
      quantity: Number(quantity),
      productId: selectedProductObj.id,
      productName: selectedProductObj.name,
      unit: selectedProductObj.unit,
      variant: variant,
      bloodGroup: bloodGroup,
      patientName: patientName,
      comment
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0">
          <h3 className="font-bold text-slate-800">Talabnomani Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
           <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {selectedProductObj?.variants && selectedProductObj.variants.length > 0 ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi/Turi</label>
                <select
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  {selectedProductObj.variants.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            ) : (
                <div className="flex items-end pb-2 text-sm text-slate-400">Variantlar yo'q</div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Qon Guruhi</label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
              >
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bemor F.I.O</label>
            <input
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Soni (Count)</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Izoh</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2 sticky bottom-0">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 1.2 EDIT USER MODAL
const EditUserModal = ({ 
  user, 
  onClose, 
  onSave 
}: { 
  user: User, 
  onClose: () => void, 
  onSave: (u: User) => void 
}) => {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState(user.password || '');

  const handleSave = () => {
    if (!name || !username || !password) return;
    onSave({
      ...user,
      name,
      username,
      password
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Tashkilot Ma'lumotlarini Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tashkilot Nomi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Parol (Yangilash)</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Yangi parol"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 1.3 EDIT PRODUCT MODAL
const EditProductModal = ({ 
  product, 
  onClose, 
  onSave 
}: { 
  product: Product, 
  onClose: () => void, 
  onSave: (p: Product) => void 
}) => {
  const [name, setName] = useState(product.name);
  const [unit, setUnit] = useState(product.unit);
  const [variants, setVariants] = useState(product.variants ? product.variants.join(', ') : '');

  const handleSave = () => {
    if (!name || !unit) return;
    onSave({
      ...product,
      name,
      unit,
      variants: variants.trim() ? variants.split(',').map(v => v.trim()) : []
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800">Mahsulotni Tahrirlash</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot Nomi</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">O'lchov Birligi</label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Variantlar (vergul bilan ajratilgan)</label>
            <input
              type="text"
              value={variants}
              onChange={(e) => setVariants(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0.200, 0.250"
            />
            <p className="text-xs text-slate-400 mt-1">Masalan: 0.200, 0.250 (agar variant bo'lmasa bo'sh qoldiring)</p>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition">Bekor qilish</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
            <Save size={16} className="mr-2" /> Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

// 2. ADMIN DASHBOARD
const AdminDashboard = ({ 
  requests, 
  products,
  onUpdateStatus,
  onDeleteRequest,
  onEditRequest
}: { 
  requests: Requisition[], 
  products: Product[],
  onUpdateStatus: (id: string, status: RequestStatus) => void,
  onDeleteRequest: (id: string) => void,
  onEditRequest: (req: Requisition) => void
}) => {
  const [editingItem, setEditingItem] = useState<Requisition | null>(null);
  const [patientSearch, setPatientSearch] = useState('');

  const pendingRequests = requests.filter(r => r.status === RequestStatus.PENDING).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const historyRequests = requests.filter(r => r.status !== RequestStatus.PENDING).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter history requests by patient name
  const filteredHistory = historyRequests.filter(req => {
    if (!patientSearch) return true;
    return req.patientName?.toLowerCase().includes(patientSearch.toLowerCase());
  });

  const openEdit = (req: Requisition) => {
    setEditingItem(req);
  };

  const handleSaveEdit = (updatedReq: Requisition) => {
    onEditRequest(updatedReq);
    setEditingItem(null);
  };

  return (
    <div className="space-y-8">
      {editingItem && (
        <EditRequestModal 
          request={editingItem} 
          products={products}
          onClose={() => setEditingItem(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Kelib tushgan talabnomalar</h2>
        {pendingRequests.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-slate-500">
            Hozircha yangi talabnomalar mavjud emas.
          </div>
        ) : (
          <div className="grid gap-4">
            {pendingRequests.map((req) => (
              <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row items-start lg:items-center justify-between hover:shadow-md transition group">
                <div className="mb-4 lg:mb-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-lg text-slate-800">{req.orgName}</span>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Kutilmoqda</span>
                  </div>
                  <div className="text-slate-600 mt-2 flex flex-col space-y-1">
                    <div className="flex items-center">
                      <span className="font-semibold text-blue-600">{req.productName}</span>
                      {req.variant && <span className="text-slate-500 ml-2 bg-slate-100 px-2 rounded-md text-sm">{req.variant}</span>}
                    </div>
                    {req.bloodGroup && (
                      <div className="flex items-center text-red-600 font-medium text-sm">
                        <Droplet size={14} className="mr-1 fill-current" />
                        Guruh: {req.bloodGroup}
                      </div>
                    )}
                    {req.patientName && (
                      <div className="flex items-center text-slate-700 text-sm">
                        <UserIcon size={14} className="mr-1" />
                        Bemor: <span className="font-medium ml-1">{req.patientName}</span>
                      </div>
                    )}
                    <div className="text-sm">
                      Soni: <span className="font-bold text-slate-900">{req.quantity} ta</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex items-center">
                    <Clock size={12} className="mr-1" /> {new Date(req.date).toLocaleString('uz-UZ')}
                  </p>
                  {req.comment && <p className="text-sm text-slate-500 mt-2 italic bg-slate-50 p-2 rounded border border-slate-100 inline-block">"{req.comment}"</p>}
                </div>
                <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                   <button
                    onClick={() => openEdit(req)}
                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    title="Tahrirlash"
                  >
                    <Pencil size={18} />
                  </button>
                   <button
                    onClick={() => onDeleteRequest(req.id)}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 size={18} />
                  </button>
                  <div className="w-px h-8 bg-slate-200 mx-2 hidden lg:block"></div>
                  <button
                    onClick={() => onUpdateStatus(req.id, RequestStatus.APPROVED)}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-1 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 border border-green-200 transition"
                  >
                    <Check size={16} /> <span>Tasdiqlash</span>
                  </button>
                  <button
                    onClick={() => onUpdateStatus(req.id, RequestStatus.REJECTED)}
                    className="flex-1 lg:flex-none flex items-center justify-center space-x-1 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 border border-red-200 transition"
                  >
                    <X size={16} /> <span>Rad etish</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <h2 className="text-xl font-bold text-slate-800">Tarix va Barcha Talabnomalar</h2>
          <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
             </div>
             <input 
                type="text"
                value={patientSearch}
                onChange={(e) => setPatientSearch(e.target.value)}
                placeholder="Bemorni qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
             />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium text-slate-500">Tashkilot</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Mahsulot</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Bemor</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Hajmi/Guruh</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Soni</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Sana</th>
                  <th className="px-6 py-3 font-medium text-slate-500">Holat</th>
                  <th className="px-6 py-3 font-medium text-slate-500 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                        Ma'lumot topilmadi
                      </td>
                    </tr>
                ) : (
                    filteredHistory.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-50 transition">
                        <td className="px-6 py-3 font-medium">{req.orgName}</td>
                        <td className="px-6 py-3">{req.productName}</td>
                        <td className="px-6 py-3">{req.patientName || '-'}</td>
                        <td className="px-6 py-3">
                          <div className="flex flex-col text-xs">
                            <span>{req.variant ? `${req.variant} ${req.unit}` : '-'}</span>
                            {req.bloodGroup && (
                                <span className="font-semibold text-red-700">{req.bloodGroup}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 font-semibold">{req.quantity} ta</td>
                        <td className="px-6 py-3 text-slate-500">{new Date(req.date).toLocaleDateString('uz-UZ')}</td>
                        <td className="px-6 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-700' :
                            req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {req.status === RequestStatus.APPROVED ? 'Tasdiqlandi' : 
                            req.status === RequestStatus.REJECTED ? 'Rad etildi' : 'Kutilmoqda'}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-right space-x-2">
                          <button 
                            onClick={() => openEdit(req)}
                            className="text-slate-400 hover:text-blue-600 transition"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => onDeleteRequest(req.id)}
                            className="text-slate-400 hover:text-red-600 transition"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
// ... (AdminWarehouse, AdminStats, OrgWarehouse, OrgStats, AdminUsers, AdminProducts - UNCHANGED)
// Only include the AdminWarehouse, AdminStats, OrgWarehouse, OrgStats, AdminUsers, AdminProducts definitions here to keep context for the XML replacement
// For this output, I will assume the user has the code for these and only AdminSettings changes heavily.
// However, since I need to output full file if changed, I must provide all components if I rewrite App.tsx or use targeted replacement.
// The user asked to update files. I will provide the FULL content of App.tsx with all components to ensure nothing breaks.

const AdminWarehouse = ({
  users,
  products,
  stockTransactions,
  onAddStock
}: {
  users: User[],
  products: Product[],
  stockTransactions: StockTransaction[],
  onAddStock: (productId: string, variant: string, quantity: number, comment: string) => void
}) => {
  const [activeTab, setActiveTab] = useState<'central' | 'orgs'>('central');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  
  // Existing state for Central Add Stock
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [comment, setComment] = useState('');
  
  // Calculate current stock for ADMIN
  const currentStock: Record<string, number> = {};
  
  stockTransactions.filter(tx => tx.orgId === 'admin').forEach(tx => {
    const key = `${tx.productId}-${tx.variant || 'default'}`;
    if (!currentStock[key]) currentStock[key] = 0;
    
    if (tx.type === 'IN') {
      currentStock[key] += tx.quantity;
    } else {
      currentStock[key] -= tx.quantity;
    }
  });

  // Calculate stock for Selected Org
  const orgStock: Record<string, number> = {};
  if (activeTab === 'orgs' && selectedOrgId) {
     stockTransactions.filter(tx => tx.orgId === selectedOrgId).forEach(tx => {
        const key = `${tx.productId}-${tx.variant || 'default'}`;
        if (!orgStock[key]) orgStock[key] = 0;
        
        if (tx.type === 'IN') {
          orgStock[key] += tx.quantity;
        } else {
          orgStock[key] -= tx.quantity;
        }
     });
  }

  // When product changes, reset/set default variant
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    onAddStock(selectedProduct, selectedVariant, Number(quantity), comment);
    setQuantity(0);
    setComment('');
  };

  const currentProduct = products.find(p => p.id === selectedProduct);
  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
          <button 
              onClick={() => setActiveTab('central')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'central' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
              Markaziy Ombor
          </button>
          <button 
               onClick={() => setActiveTab('orgs')}
               className={`px-4 py-2 text-sm font-medium rounded-md transition ${activeTab === 'orgs' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
              Tashkilotlar Ombori (Monitoring)
          </button>
      </div>

      {activeTab === 'central' ? (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Omborxona (Markaziy): Kirim qilish</h2>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="lg:col-span-1">
                   <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi / Turi</label>
                   {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                      <select
                        value={selectedVariant}
                        onChange={(e) => setSelectedVariant(e.target.value)}
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                      >
                        {currentProduct.variants.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    ) : (
                      <input 
                        type="text" 
                        disabled 
                        value="Variant mavjud emas" 
                        className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg"
                      />
                    )}
                </div>

                <div className="lg:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor (Kirim)</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity || ''}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="0"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
                >
                  <ArrowDownLeft size={18} />
                  <span>Kirim Qilish</span>
                </button>
              </form>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800 mb-4">Ombor Qoldig'i (Jami)</h2>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                    <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                    <th className="px-6 py-4 font-medium text-slate-500">Mavjud Qoldiq</th>
                    <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {products.length === 0 && (
                     <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
                   )}
                   {products.map(p => {
                      if (p.variants && p.variants.length > 0) {
                        return p.variants.map(v => {
                           const key = `${p.id}-${v}`;
                           const qty = currentStock[key] || 0;
                           return (
                             <tr key={key} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                               <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                               <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                               <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                             </tr>
                           )
                        });
                      } else {
                         const key = `${p.id}-default`;
                         const qty = currentStock[key] || 0;
                         return (
                            <tr key={key} className="hover:bg-slate-50">
                               <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                               <td className="px-6 py-4 text-slate-400 italic">-</td>
                               <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                               <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                             </tr>
                         )
                      }
                   })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
         <div className="space-y-8 animate-in fade-in duration-300">
            <div>
               <h2 className="text-2xl font-bold text-slate-800 mb-6">Tashkilotlar Ombori Monitoringi</h2>
               <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-6">
                 <label className="block text-sm font-medium text-slate-700 mb-2">Tashkilotni tanlang</label>
                 <select 
                    value={selectedOrgId}
                    onChange={(e) => setSelectedOrgId(e.target.value)}
                    className="w-full md:w-1/2 px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                 >
                     <option value="">-- Tashkilotni tanlang --</option>
                     {orgUsers.map(u => (
                         <option key={u.id} value={u.id}>{u.name}</option>
                     ))}
                 </select>
               </div>

               {selectedOrgId ? (
                 <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                       <h3 className="font-bold text-slate-800 flex items-center">
                          <Building className="mr-2 text-blue-600" size={18} />
                          {users.find(u => u.id === selectedOrgId)?.name}
                       </h3>
                    </div>
                    <table className="w-full text-left">
                       <thead className="bg-slate-50 border-b border-slate-200">
                         <tr>
                           <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                           <th className="px-6 py-4 font-medium text-slate-500">Qoldiq (Tashkilotda)</th>
                           <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {products.length === 0 && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
                          )}
                          {products.map(p => {
                             if (p.variants && p.variants.length > 0) {
                               return p.variants.map(v => {
                                  const key = `${p.id}-${v}`;
                                  const qty = orgStock[key] || 0;
                                  return (
                                    <tr key={key} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                      <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                                      <td className={`px-6 py-4 font-bold ${qty > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{qty}</td>
                                      <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                                    </tr>
                                  )
                               });
                             } else {
                                const key = `${p.id}-default`;
                                const qty = orgStock[key] || 0;
                                return (
                                   <tr key={key} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                                      <td className="px-6 py-4 text-slate-400 italic">-</td>
                                      <td className={`px-6 py-4 font-bold ${qty > 0 ? 'text-blue-600' : 'text-slate-400'}`}>{qty}</td>
                                      <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                                    </tr>
                                )
                             }
                          })}
                          {Object.values(orgStock).every(q => q === 0) && (
                            <tr><td colSpan={4} className="p-6 text-center text-slate-400">Bu tashkilotda mahsulot qoldig'i mavjud emas</td></tr>
                          )}
                       </tbody>
                    </table>
                 </div>
               ) : (
                 <div className="text-center py-10 text-slate-400 bg-white rounded-xl border border-dashed border-slate-300">
                    Ma'lumotlarni ko'rish uchun yuqorida tashkilotni tanlang
                 </div>
               )}
            </div>
         </div>
      )}
    </div>
  );
};

const AdminStats = ({ requests, users }: { requests: Requisition[], users: User[] }) => {
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [patientFilter, setPatientFilter] = useState('');

  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  // Filter requests based on selected Org AND Patient
  const filteredRequests = requests.filter(r => {
    const matchOrg = selectedOrgId ? r.orgId === selectedOrgId : true;
    const matchPatient = patientFilter ? r.patientName?.toLowerCase().includes(patientFilter.toLowerCase()) : true;
    return matchOrg && matchPatient;
  });

  // Filter only approved for valid stats
  const approved = filteredRequests.filter(r => r.status === RequestStatus.APPROVED);

  // Data preparation for charts
  const productCount: Record<string, number> = {};
  const orgCount: Record<string, number> = {};

  approved.forEach(req => {
    // Combine name and variant for chart label
    let label = req.productName;
    if (req.variant) label += ` (${req.variant})`;
    
    productCount[label] = (productCount[label] || 0) + req.quantity;
    orgCount[req.orgName] = (orgCount[req.orgName] || 0) + 1;
  });

  const productData = Object.keys(productCount).map(name => ({ name, value: productCount[name] }));
  const orgData = Object.keys(orgCount).map(name => ({ name, requests: orgCount[name] }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  const handleAiAnalysis = async () => {
    setLoadingAi(true);
    const result = await analyzeStatistics(filteredRequests);
    setAiAnalysis(result);
    setLoadingAi(false);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const orgName = selectedOrgId ? users.find(u => u.id === selectedOrgId)?.name : "Barcha Tashkilotlar";
    const patientText = patientFilter ? `\nBemor: ${patientFilter}` : "";

    // Title
    doc.setFontSize(18);
    doc.text("TaminotManager - Statistik Hisobot", 14, 22);

    doc.setFontSize(11);
    doc.text(`Sana: ${new Date().toLocaleDateString('uz-UZ')}`, 14, 30);
    doc.text(`Tashkilot: ${orgName || 'Jami'}${patientText}`, 14, 38);

    // Data preparation
    const productRows = approved.map(r => [
      r.orgName,
      r.productName,
      r.patientName || '-',
      `${r.variant || '-'}\n${r.bloodGroup || '-'}`,
      r.quantity,
      new Date(r.date).toLocaleDateString('uz-UZ')
    ]);

    // Detail Table
    doc.text("Tasdiqlangan Talabnomalar Ro'yxati", 14, 50);
    autoTable(doc, {
        startY: 55,
        head: [['Tashkilot', 'Mahsulot', 'Bemor', 'Hajmi/Guruh', 'Soni', 'Sana']],
        body: productRows,
    });

    const lastY = (doc as any).lastAutoTable.finalY || 50;

    // Summary Org Table
    if (!selectedOrgId && !patientFilter) {
        const orgRows = orgData.map(o => [o.name, o.requests]);
        doc.text("Tashkilotlar faolligi", 14, lastY + 15);

        autoTable(doc, {
            startY: lastY + 20,
            head: [['Tashkilot', 'Talabnomalar Soni']],
            body: orgRows,
        });
    }

    doc.save("taminot_hisobot.pdf");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Statistika va Hisobotlar</h2>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {/* Filter Dropdown */}
            <div className="relative flex-grow md:flex-grow-0">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Filter size={16} className="text-slate-400" />
               </div>
               <select 
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="pl-10 pr-8 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 appearance-none bg-white cursor-pointer"
               >
                  <option value="">Barcha Tashkilotlar</option>
                  {orgUsers.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
               </select>
            </div>

             {/* Patient Search Filter */}
             <div className="relative flex-grow md:flex-grow-0">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={16} className="text-slate-400" />
               </div>
               <input
                  type="text"
                  value={patientFilter}
                  onChange={(e) => setPatientFilter(e.target.value)}
                  placeholder="Bemor bo'yicha filtrlash"
                  className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-56"
               />
            </div>

            <button 
                onClick={handleExportPDF}
                className="bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition text-sm"
            >
                <Download size={18} />
                <span>PDF</span>
            </button>
            <button 
                onClick={handleAiAnalysis}
                disabled={loadingAi}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition disabled:opacity-50 text-sm"
            >
                {loadingAi ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span>AI Tahlil</span>
            </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex flex-wrap gap-3">
         {selectedOrgId && (
            <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
               <Building size={14} className="mr-1" />
               {users.find(u => u.id === selectedOrgId)?.name}
               <button onClick={() => setSelectedOrgId('')} className="ml-2 hover:text-blue-900"><X size={14}/></button>
            </div>
         )}
         {patientFilter && (
            <div className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm font-medium flex items-center">
               <UserIcon size={14} className="mr-1" />
               Bemor: {patientFilter}
               <button onClick={() => setPatientFilter('')} className="ml-2 hover:text-purple-900"><X size={14}/></button>
            </div>
         )}
      </div>

      {aiAnalysis && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-100">
          <h3 className="text-lg font-bold text-purple-800 mb-2 flex items-center"><Sparkles size={18} className="mr-2"/> Gemini AI Xulosasi</h3>
          <div className="prose prose-sm text-slate-700 max-w-none">
             <pre className="whitespace-pre-wrap font-sans text-sm">{aiAnalysis}</pre>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Mahsulotlar Kesimida (Soni)</h3>
          {productData.length > 0 ? (
             <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={productData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    >
                    {productData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">Ma'lumot yo'q</div>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Tashkilotlar Faolligi (Talabnomalar soni)</h3>
          {orgData.length > 0 ? (
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orgData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
                </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-400">Ma'lumot yo'q</div>
          )}
        </div>
      </div>
    </div>
  );
};

const OrgWarehouse = ({
  user,
  products,
  stockTransactions,
  onAddTransaction
}: {
  user: User,
  products: Product[],
  stockTransactions: StockTransaction[],
  onAddTransaction: (productId: string, variant: string, quantity: number, comment: string) => void
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [comment, setComment] = useState('');
  
  // Calculate current stock for THIS ORG
  const currentStock: Record<string, number> = {};
  
  stockTransactions.filter(tx => tx.orgId === user.id).forEach(tx => {
    const key = `${tx.productId}-${tx.variant || 'default'}`;
    if (!currentStock[key]) currentStock[key] = 0;
    
    if (tx.type === 'IN') {
      currentStock[key] += tx.quantity;
    } else {
      currentStock[key] -= tx.quantity;
    }
  });

  // When product changes, reset/set default variant
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || quantity <= 0) return;
    
    // Org uses item -> OUT transaction
    onAddTransaction(selectedProduct, selectedVariant, Number(quantity), comment);
    setQuantity(0);
    setComment('');
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  return (
    <div className="space-y-8">
       <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Ombor Qoldig'i (Bizning Tashkilot)</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Hajmi / Variant</th>
                <th className="px-6 py-4 font-medium text-slate-500">Mavjud Qoldiq</th>
                <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {products.length === 0 && (
                 <tr><td colSpan={4} className="p-6 text-center text-slate-400">Mahsulotlar yo'q</td></tr>
               )}
               {products.map(p => {
                  if (p.variants && p.variants.length > 0) {
                    return p.variants.map(v => {
                       const key = `${p.id}-${v}`;
                       const qty = currentStock[key] || 0;
                       if (qty === 0) return null; // Only show items they actually have
                       return (
                         <tr key={key} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                           <td className="px-6 py-4 text-slate-600"><span className="bg-slate-100 px-2 py-1 rounded text-xs">{v}</span></td>
                           <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                           <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                         </tr>
                       )
                    });
                  } else {
                     const key = `${p.id}-default`;
                     const qty = currentStock[key] || 0;
                     if (qty === 0) return null;
                     return (
                        <tr key={key} className="hover:bg-slate-50">
                           <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                           <td className="px-6 py-4 text-slate-400 italic">-</td>
                           <td className="px-6 py-4 font-bold text-blue-600">{qty}</td>
                           <td className="px-6 py-4 text-slate-500">{p.unit}</td>
                         </tr>
                     )
                  }
               })}
               {Object.values(currentStock).every(val => val === 0) && (
                 <tr><td colSpan={4} className="p-6 text-center text-slate-400">Omborda mahsulot yo'q. (Tasdiqlangan talabnomalar avtomatik kirim qilinadi)</td></tr>
               )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Ishlatilgan Mahsulotni Kiritish (Chiqim)</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
             <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-1">
               <label className="block text-sm font-medium text-slate-700 mb-1">Hajmi / Turi</label>
               {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {currentProduct.variants.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    disabled 
                    value="Variant mavjud emas" 
                    className="w-full px-3 py-2.5 border border-slate-200 bg-slate-50 text-slate-400 rounded-lg"
                  />
                )}
            </div>

            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-700 mb-1">Miqdor (Ishlatildi)</label>
              <input
                type="number"
                min="1"
                value={quantity || ''}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0"
              />
            </div>

            <button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <ArrowUpRight size={18} />
              <span>Chiqim Qilish</span>
            </button>
          </form>
          <p className="text-xs text-slate-400 mt-2">Izoh: Bu faqat sizning ichki hisobingiz uchun. Admin omboriga ta'sir qilmaydi.</p>
        </div>
      </div>
    </div>
  );
};

const OrgStats = ({ requests }: { requests: Requisition[] }) => {
  // Only use requests for THIS ORG (already filtered by parent)
  const approved = requests.filter(r => r.status === RequestStatus.APPROVED);

  const productCount: Record<string, number> = {};
  
  approved.forEach(req => {
    let label = req.productName;
    if (req.variant) label += ` (${req.variant})`;
    productCount[label] = (productCount[label] || 0) + req.quantity;
  });

  const productData = Object.keys(productCount).map(name => ({ name, value: productCount[name] }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff6b6b', '#4ecdc4'];

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-slate-800">Mening Statistikam</h2>

      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-bold text-slate-700 mb-6">Olingan Mahsulotlar (Soni)</h3>
         {productData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={productData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {productData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
         ) : (
             <div className="text-center text-slate-400 py-10">Hozircha ma'lumot yo'q</div>
         )}
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
         <h3 className="text-lg font-bold text-slate-700 mb-4">Umumiy Ma'lumot</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-blue-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Jami Talabnomalar</p>
                 <p className="text-2xl font-bold text-blue-600">{requests.length} ta</p>
             </div>
             <div className="bg-green-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Tasdiqlangan</p>
                 <p className="text-2xl font-bold text-green-600">{requests.filter(r => r.status === RequestStatus.APPROVED).length} ta</p>
             </div>
             <div className="bg-yellow-50 p-4 rounded-lg">
                 <p className="text-sm text-slate-500">Kutilmoqda</p>
                 <p className="text-2xl font-bold text-yellow-600">{requests.filter(r => r.status === RequestStatus.PENDING).length} ta</p>
             </div>
         </div>
      </div>
    </div>
  );
};

const AdminUsers = ({ 
  users, 
  requests,
  onAddUser, 
  onUpdateUser,
  onDeleteUser 
}: { 
  users: User[], 
  requests: Requisition[],
  onAddUser: (u: User) => void,
  onUpdateUser: (u: User) => void,
  onDeleteUser: (id: string) => void
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // States for visibility and editing
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const orgUsers = users.filter(u => u.role === UserRole.ORG);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !password) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }
    
    // Simple frontend check, but API will also check
    if (users.some(u => u.username === username)) {
      setError("Bu login band");
      return;
    }

    const newUser: User = {
      id: '', // API assigns this
      name,
      username,
      password,
      role: UserRole.ORG
    };

    onAddUser(newUser);
    setName('');
    setUsername('');
    setPassword('');
    setError('');
  };

  const togglePasswordVisibility = (id: string) => {
    const newSet = new Set(visiblePasswords);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setVisiblePasswords(newSet);
  };

  const handleSaveEdit = (updatedUser: User) => {
    onUpdateUser(updatedUser);
    setEditingUser(null);
  };

  return (
    <div className="space-y-8">
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      {/* Create New Org */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Tashkilot Qo'shish</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tashkilot Nomi</label>
              <div className="relative">
                <Building size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: 5-Maktab"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Login</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="login123"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Parol</label>
              <div className="relative">
                <Key size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <PlusCircle size={18} />
              <span>Qo'shish</span>
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      </div>

      {/* List Existing Orgs */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mavjud Tashkilotlar ({orgUsers.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Tashkilot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Login</th>
                <th className="px-6 py-4 font-medium text-slate-500">Parol</th>
                <th className="px-6 py-4 font-medium text-slate-500">Faollik</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orgUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Tashkilotlar ro'yxati bo'sh
                  </td>
                </tr>
              ) : (
                orgUsers.map((u) => {
                  const reqCount = requests.filter(r => r.orgId === u.id).length;
                  const isPasswordVisible = visiblePasswords.has(u.id);
                  return (
                    <tr key={u.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-800">{u.name}</td>
                      <td className="px-6 py-4 text-slate-600">{u.username}</td>
                      <td className="px-6 py-4 text-slate-600 flex items-center space-x-2">
                        <span className="font-mono">{isPasswordVisible ? u.password : '••••••'}</span>
                        <button 
                          onClick={() => togglePasswordVisibility(u.id)}
                          className="text-slate-400 hover:text-blue-600 transition"
                          title={isPasswordVisible ? "Yashirish" : "Ko'rsatish"}
                        >
                          {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-medium border border-blue-100">
                           {reqCount} ta talabnoma
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                           <button 
                            onClick={() => setEditingUser(u)}
                            className="text-slate-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                            title="Tahrirlash / Parolni tiklash"
                          >
                            <Pencil size={18} />
                          </button>
                          <button 
                            onClick={() => onDeleteUser(u.id)}
                            className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition"
                            title="O'chirish"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const AdminProducts = ({
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct
}: {
  products: Product[],
  onAddProduct: (p: Product) => void,
  onUpdateProduct: (p: Product) => void,
  onDeleteProduct: (id: string) => void
}) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [variants, setVariants] = useState('');
  const [error, setError] = useState('');
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !unit) {
      setError("Mahsulot nomi va o'lchov birligini kiriting");
      return;
    }

    const newProduct: Product = {
      id: '', // API handles
      name,
      unit,
      variants: variants.trim() ? variants.split(',').map(v => v.trim()) : []
    };

    onAddProduct(newProduct);
    setName('');
    setUnit('');
    setVariants('');
    setError('');
  };

  const handleSaveEdit = (updatedProduct: Product) => {
    onUpdateProduct(updatedProduct);
    setEditingProduct(null);
  };

  return (
    <div className="space-y-8">
      {editingProduct && (
        <EditProductModal 
          product={editingProduct} 
          onClose={() => setEditingProduct(null)} 
          onSave={handleSaveEdit} 
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Mahsulot Qo'shish</h2>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mahsulot Nomi</label>
              <div className="relative">
                <Package size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: СЗП"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">O'lchov Birligi</label>
              <div className="relative">
                <Scale size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Masalan: litr"
                />
              </div>
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Variantlar (vergul bilan)</label>
              <div className="relative">
                <ListFilter size={18} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  value={variants}
                  onChange={(e) => setVariants(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="0.200, 0.250"
                />
              </div>
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition shadow flex items-center justify-center space-x-2"
            >
              <PlusCircle size={18} />
              <span>Qo'shish</span>
            </button>
          </form>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-4">Mavjud Mahsulotlar ({products.length})</h2>
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 font-medium text-slate-500">Mahsulot Nomi</th>
                <th className="px-6 py-4 font-medium text-slate-500">O'lchov Birligi</th>
                <th className="px-6 py-4 font-medium text-slate-500">Variantlar</th>
                <th className="px-6 py-4 font-medium text-slate-500 text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                    Mahsulotlar ro'yxati bo'sh
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-medium text-slate-800">{p.name}</td>
                    <td className="px-6 py-4 text-slate-600">{p.unit}</td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {p.variants && p.variants.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {p.variants.map((v, i) => (
                            <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-xs border border-slate-200">
                              {v}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="italic text-slate-400">Yo'q</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => setEditingProduct(p)}
                          className="text-slate-500 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-lg transition"
                          title="Tahrirlash"
                        >
                          <Pencil size={18} />
                        </button>
                        <button 
                          onClick={() => onDeleteProduct(p.id)}
                          className="text-red-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition"
                          title="O'chirish"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// 4.2 SETTINGS MANAGEMENT
const AdminSettings = ({
  config,
  onSave,
  githubConfig,
  onSaveGithub,
  onBackup,
  onRestore
}: {
  config: TelegramConfig,
  onSave: (c: TelegramConfig) => void,
  githubConfig: GithubConfig,
  onSaveGithub: (g: GithubConfig) => void,
  onBackup: () => void,
  onRestore: () => void
}) => {
  // Telegram State
  const [botToken, setBotToken] = useState(config.botToken);
  const [chatId, setChatId] = useState(config.chatId);
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  // GitHub State
  const [ghToken, setGhToken] = useState(githubConfig.token);
  const [ghOwner, setGhOwner] = useState(githubConfig.owner);
  const [ghRepo, setGhRepo] = useState(githubConfig.repo);
  const [ghPath, setGhPath] = useState(githubConfig.path);
  const [ghSaved, setGhSaved] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showGithubHelp, setShowGithubHelp] = useState(false);

  const handleSaveTelegram = () => {
    onSave({ botToken, chatId });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleSaveGithub = () => {
    onSaveGithub({ token: ghToken, owner: ghOwner, repo: ghRepo, path: ghPath || 'taminot_data.json' });
    setGhSaved(true);
    setTimeout(() => setGhSaved(false), 3000);
  };

  const handleTestMessage = async () => {
    if (!botToken || !chatId) return;
    setTestStatus('sending');
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: "✅ <b>Sinov Xabari</b>\n\nTaminotManager tizimi Telegram boti muvaffaqiyatli ulandi!",
          parse_mode: 'HTML'
        })
      });
      if (response.ok) {
        setTestStatus('success');
      } else {
        setTestStatus('error');
      }
    } catch (e) {
      console.error(e);
      setTestStatus('error');
    }
  };

  const handleBackupClick = async () => {
    setSyncStatus('loading');
    try {
      await onBackup();
      setSyncStatus('success');
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  const handleRestoreClick = async () => {
    if (!window.confirm("Diqqat! Bu amal joriy ma'lumotlarni GitHubdagi nusxa bilan almashtiradi. Davom etasizmi?")) return;
    setSyncStatus('loading');
    try {
      await onRestore();
      setSyncStatus('success');
    } catch (e) {
      console.error(e);
      setSyncStatus('error');
    }
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tizim Sozlamalari</h2>
        <p className="text-slate-500 mb-6">Telegram bildirishnomalari va GitHub ma'lumotlar bazasi integratsiyasi.</p>
        
        {/* TELEGRAM CONFIG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 mb-8">
          <h3 className="text-lg font-bold text-slate-700 mb-4 flex items-center">
             <Send className="mr-2 text-blue-500" size={20} /> Telegram Bot Integratsiyasi
          </h3>
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
               BotFather orqali yaratilgan bot tokenini va xabarlar boradigan guruh ID sini kiriting.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Telegram Bot Token</label>
                <input
                  type="text"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="123456:ABC-DEF..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Chat ID</label>
                <input
                  type="text"
                  value={chatId}
                  onChange={(e) => setChatId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="-100123456789"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 pt-2 border-t border-slate-100 mt-4">
              <button
                onClick={handleSaveTelegram}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition shadow flex items-center"
              >
                <Save size={18} className="mr-2" />
                Saqlash
              </button>
              
              <button
                onClick={handleTestMessage}
                disabled={!botToken || !chatId || testStatus === 'sending'}
                className={`flex items-center font-medium py-2 px-4 rounded-lg transition border ${
                  testStatus === 'success' ? 'bg-green-50 text-green-700 border-green-200' :
                  testStatus === 'error' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                 {testStatus === 'sending' ? <Loader2 className="animate-spin mr-2" size={18} /> : 
                  testStatus === 'success' ? <Check className="mr-2" size={18} /> : 
                  testStatus === 'error' ? <AlertCircle className="mr-2" size={18} /> :
                  <Send className="mr-2" size={18} />
                 }
                 Sinov Xabari
              </button>
              {isSaved && <span className="text-green-600 text-sm font-medium animate-pulse">Saqlandi!</span>}
            </div>
          </div>
        </div>

        {/* GITHUB CONFIG */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-700 flex items-center">
                <Github className="mr-2 text-slate-800" size={20} /> GitHub Ma'lumotlar Bazasi (Zaxira)
              </h3>
              <button 
                onClick={() => setShowGithubHelp(!showGithubHelp)}
                className="text-blue-600 text-sm hover:underline flex items-center"
              >
                <HelpCircle size={16} className="mr-1" />
                {showGithubHelp ? "Yo'riqnomani yashirish" : "Qanday ulanadi?"}
                {showGithubHelp ? <ChevronUp size={16} className="ml-1"/> : <ChevronDown size={16} className="ml-1"/>}
              </button>
           </div>
           
          <div className="space-y-6">
             {showGithubHelp && (
               <div className="bg-slate-50 border border-slate-200 p-5 rounded-lg text-sm text-slate-700 animate-in fade-in slide-in-from-top-2">
                 <h4 className="font-bold mb-3 text-slate-800">GitHub Token olish bo'yicha qo'llanma:</h4>
                 <ol className="list-decimal pl-5 space-y-2">
                   <li><a href="https://github.com" target="_blank" rel="noreferrer" className="text-blue-600 underline flex items-center inline-flex">GitHub.com <ExternalLink size={12} className="ml-1"/></a> saytiga kiring va profilingizga o'ting.</li>
                   <li>O'ng yuqori burchakdagi rasm ustiga bosib <strong>Settings</strong> ga kiring.</li>
                   <li>Chap menyuning eng pastidan <strong>Developer settings</strong> ni tanlang.</li>
                   <li><strong>Personal access tokens</strong> -> <strong>Tokens (classic)</strong> bo'limiga o'ting.</li>
                   <li><strong>Generate new token (classic)</strong> tugmasini bosing.</li>
                   <li>"Note" qismiga ixtiyoriy nom yozing (masalan: TaminotApp).</li>
                   <li><strong>Select scopes</strong> qismida <strong>repo</strong> katagini belgilang <span className="text-red-600 font-bold">(Bu juda muhim!)</span>.</li>
                   <li>Pastga tushib <strong>Generate token</strong> tugmasini bosing.</li>
                   <li>Hosil bo'lgan tokenni nusxalab oling va pastdagi "Personal Access Token" maydoniga qo'ying.</li>
                 </ol>
               </div>
             )}

             <div className="bg-yellow-50 border border-yellow-100 p-4 rounded-lg text-sm text-yellow-800">
               <p className="font-semibold mb-1">Ma'lumotlarni saqlash va tiklash uchun:</p>
               GitHubda shaxsiy repozitoriy yarating va "Personal Access Token" oling. Bu sizning ma'lumotlaringizni serverga (bulutga) yuklash imkonini beradi.
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Personal Access Token (Repo scope)</label>
                <input
                  type="password"
                  value={ghToken}
                  onChange={(e) => setGhToken(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  placeholder="ghp_xxxxxxxxxxxx"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">GitHub Username (Owner)</label>
                <input
                  type="text"
                  value={ghOwner}
                  onChange={(e) => setGhOwner(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Repository Name</label>
                <input
                  type="text"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="my-repo"
                />
              </div>

               <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">File Path (JSON)</label>
                <input
                  type="text"
                  value={ghPath}
                  onChange={(e) => setGhPath(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                  placeholder="data/taminot_backup.json"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between pt-4 border-t border-slate-100 mt-4 gap-4">
               <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSaveGithub}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-6 rounded-lg transition shadow flex items-center"
                  >
                    <Save size={18} className="mr-2" />
                    Sozlamalarni Saqlash
                  </button>
                  {ghSaved && <span className="text-green-600 text-sm font-medium animate-pulse">Saqlandi!</span>}
               </div>

               <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRestoreClick}
                    disabled={syncStatus === 'loading' || !ghToken}
                    className="flex items-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition"
                  >
                     <CloudDownload size={18} className="mr-2 text-blue-600" />
                     Yuklab Olish (Restore)
                  </button>

                  <button
                    onClick={handleBackupClick}
                    disabled={syncStatus === 'loading' || !ghToken}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm"
                  >
                     <CloudUpload size={18} className="mr-2" />
                     Serverga Yuklash (Backup)
                  </button>
               </div>
            </div>
            {syncStatus === 'loading' && <p className="text-blue-600 text-sm text-right animate-pulse">Jarayon bajarilmoqda...</p>}
            {syncStatus === 'success' && <p className="text-green-600 text-sm text-right font-medium">Muvaffaqiyatli bajarildi!</p>}
            {syncStatus === 'error' && <p className="text-red-600 text-sm text-right font-medium">Xatolik yuz berdi. Sozlamalarni tekshiring.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

// ... (OrgRequestForm, OrgHistory - UNCHANGED)
// Again, ensuring we just replace App component properly or provide full file. I provide full file.

const OrgRequestForm = ({ 
  user, 
  products,
  onSubmit 
}: { 
  user: User, 
  products: Product[],
  onSubmit: (req: Partial<Requisition>) => void 
}) => {
  const [selectedProduct, setSelectedProduct] = useState(products.length > 0 ? products[0].id : '');
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState(BLOOD_GROUPS[0]);
  const [patientName, setPatientName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [comment, setComment] = useState('');
  const [success, setSuccess] = useState(false);
  const [sending, setSending] = useState(false);

  // Update selectedProduct if products change (e.g., initial load)
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
        setSelectedProduct(products[0].id);
    }
  }, [products]);

  // When product changes, set default variant if available
  useEffect(() => {
    const product = products.find(p => p.id === selectedProduct);
    if (product && product.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]);
    } else {
      setSelectedVariant('');
    }
  }, [selectedProduct, products]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === selectedProduct);
    if (!product) return;

    setSending(true);
    await onSubmit({
      productId: product.id,
      productName: product.name,
      quantity: Number(quantity),
      unit: product.unit,
      variant: selectedVariant,
      bloodGroup: selectedBloodGroup,
      patientName: patientName,
      comment
    });
    setSending(false);

    setSuccess(true);
    setQuantity(1);
    setPatientName('');
    setComment('');
    setTimeout(() => setSuccess(false), 3000);
  };

  const currentProduct = products.find(p => p.id === selectedProduct);

  if (products.length === 0) {
      return (
          <div className="text-center p-8 bg-white rounded-xl shadow-sm text-slate-500">
              Hozircha tizimda mahsulotlar mavjud emas. Iltimos admin bilan bog'laning.
          </div>
      )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Yangi Talabnoma Yuborish</h2>
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        {success && (
          <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-lg flex items-center animate-in fade-in slide-in-from-top-2">
            <Check size={20} className="mr-2" /> Talabnoma muvaffaqiyatli yuborildi!
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Mahsulotni tanlang</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
            >
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name} (o'lchov: {p.unit})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hajmi / Turi ({currentProduct?.unit})
                </label>
                {currentProduct?.variants && currentProduct.variants.length > 0 ? (
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                  >
                    {currentProduct.variants.map(v => (
                      <option key={v} value={v}>{v}</option>
                    ))}
                  </select>
                ) : (
                   <div className="w-full px-4 py-3 border border-slate-200 bg-slate-50 rounded-lg text-slate-400 italic">
                      Variantlar yo'q
                   </div>
                )}
             </div>

             <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                   Qon Guruhi
                </label>
                <select
                  value={selectedBloodGroup}
                  onChange={(e) => setSelectedBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-slate-50"
                >
                  {BLOOD_GROUPS.map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Bemor Ism-Familiyasi (F.I.O)
            </label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Masalan: Abdullayev A."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Soni (necha dona)
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Qo'shimcha izoh (ixtiyoriy)</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Masalan: Shoshilinch zarur"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition shadow-md hover:shadow-lg flex justify-center items-center"
          >
            {sending ? <Loader2 className="animate-spin mr-2" /> : <PlusCircle size={20} className="mr-2" />}
            {sending ? 'Yuborilmoqda...' : 'Yuborish'}
          </button>
        </form>
      </div>
    </div>
  );
};

const OrgHistory = ({ requests }: { requests: Requisition[] }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRequests = requests.filter(req => {
    if (!searchTerm) return true;
    return req.patientName?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">Mening Talabnomalarim Tarixi</h2>
          <div className="relative w-full md:w-64">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400" />
             </div>
             <input 
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Bemor bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
             />
          </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Sana</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Mahsulot</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Bemor</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Hajmi</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Guruh</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Soni</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Holat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                  {searchTerm ? "So'rovingiz bo'yicha ma'lumot topilmadi." : "Hozircha tarix mavjud emas."}
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 text-slate-600">
                    {new Date(req.date).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{req.productName}</td>
                  <td className="px-6 py-4 text-slate-600">{req.patientName || '-'}</td>
                  <td className="px-6 py-4 text-slate-600">{req.variant ? `${req.variant} ${req.unit}` : '-'}</td>
                   <td className="px-6 py-4 text-slate-600">
                    <span className="font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded text-xs border border-red-100">
                      {req.bloodGroup || '-'}
                    </span>
                   </td>
                  <td className="px-6 py-4 text-slate-600">{req.quantity} ta</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      req.status === RequestStatus.APPROVED ? 'bg-green-100 text-green-800' :
                      req.status === RequestStatus.REJECTED ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {req.status === RequestStatus.APPROVED ? 'Tasdiqlandi' :
                       req.status === RequestStatus.REJECTED ? 'Rad etildi' : 'Kutilmoqda'}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<Requisition[]>([]);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>([]);
  const [telegramConfig, setTelegramConfig] = useState<TelegramConfig>({ botToken: '', chatId: '' });
  const [githubConfig, setGithubConfig] = useState<GithubConfig>({ token: '', owner: '', repo: '', path: '' });

  // UI States
  const [loading, setLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Initialize Data from "Backend"
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) setUser(JSON.parse(storedUser));

      const [u, p, r, s, t, g] = await Promise.all([
        api.users.getAll(),
        api.products.getAll(),
        api.requests.getAll(),
        api.stock.getAll(),
        api.telegram.getConfig(),
        api.github.getConfig()
      ]);

      setUsers(u);
      setProducts(p);
      setRequests(r);
      setStockTransactions(s);
      setTelegramConfig(t);
      setGithubConfig(g);

      setLoading(false);
      setAppReady(true);
    };

    initData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    const [u, p, r, s, t, g] = await Promise.all([
      api.users.getAll(),
      api.products.getAll(),
      api.requests.getAll(),
      api.stock.getAll(),
      api.telegram.getConfig(),
      api.github.getConfig()
    ]);
    setUsers(u);
    setProducts(p);
    setRequests(r);
    setStockTransactions(s);
    setTelegramConfig(t);
    setGithubConfig(g);
    setLoading(false);
  };

  const handleLogin = async (u: string, p: string) => {
    setLoading(true);
    const result = await api.auth.login(u, p);
    if (result.success && result.data) {
      setUser(result.data);
      localStorage.setItem('currentUser', JSON.stringify(result.data));
      setActiveTab(result.data.role === UserRole.ADMIN ? 'dashboard' : 'new-request');
      await refreshData();
    } else {
      alert(result.error);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const handleCreateRequest = async (reqData: Partial<Requisition>) => {
    if (!user) return;
    setLoading(true);
    await api.requests.create(reqData, user);
    await refreshData();
    setLoading(false);
  };

  const handleStatusUpdate = async (id: string, status: RequestStatus) => {
    setLoading(true);
    await api.requests.updateStatus(id, status);
    await refreshData();
    setLoading(false);
  };

  const handleDeleteRequest = async (id: string) => {
    if (window.confirm("Rostdan ham ushbu talabnomani o'chirmoqchimisiz?")) {
      setLoading(true);
      await api.requests.delete(id);
      await refreshData();
      setLoading(false);
    }
  };

  const handleEditRequest = async (updatedReq: Requisition) => {
    setLoading(true);
    await api.requests.update(updatedReq);
    await refreshData();
    setLoading(false);
  };

  const handleAddUser = async (newUser: User) => {
    setLoading(true);
    const res = await api.users.create(newUser);
    if (!res.success) alert(res.error);
    await refreshData();
    setLoading(false);
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setLoading(true);
    await api.users.update(updatedUser);
    await refreshData();
    setLoading(false);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Rostdan ham bu tashkilotni o'chirmoqchimisiz?")) {
      setLoading(true);
      await api.users.delete(id);
      await refreshData();
      setLoading(false);
    }
  };

  const handleAddProduct = async (newProduct: Product) => {
    setLoading(true);
    await api.products.create(newProduct);
    await refreshData();
    setLoading(false);
  };

  const handleUpdateProduct = async (updatedProduct: Product) => {
    setLoading(true);
    await api.products.update(updatedProduct);
    await refreshData();
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm("Ushbu mahsulotni o'chirsangiz, u eski hisobotlarda ham ko'rinmasligi mumkin. Davom etasizmi?")) {
      setLoading(true);
      await api.products.delete(id);
      await refreshData();
      setLoading(false);
    }
  };

  const handleAddStock = async (productId: string, variant: string, quantity: number, comment: string) => {
    setLoading(true);
    await api.stock.addTransaction({
       orgId: 'admin',
       productId,
       productName: products.find(p => p.id === productId)?.name,
       variant,
       quantity,
       type: 'IN',
       comment
    });
    await refreshData();
    setLoading(false);
  };

  const handleOrgConsumption = async (productId: string, variant: string, quantity: number, comment: string) => {
    if (!user) return;
    setLoading(true);
    await api.stock.addTransaction({
       orgId: user.id,
       productId,
       productName: products.find(p => p.id === productId)?.name,
       variant,
       quantity,
       type: 'OUT',
       comment: comment || 'Ishlatildi (Chiqim)'
    });
    await refreshData();
    setLoading(false);
  }

  const handleUpdateTelegramConfig = async (config: TelegramConfig) => {
    setLoading(true);
    await api.telegram.saveConfig(config);
    await refreshData();
    setLoading(false);
  };
  
  const handleUpdateGithubConfig = async (config: GithubConfig) => {
    setLoading(true);
    await api.github.saveConfig(config);
    await refreshData();
    setLoading(false);
  };

  // --- GITHUB BACKUP LOGIC ---
  const handleBackupToGithub = async () => {
    // 1. Gather all data
    const fullData = {
      users,
      products,
      requests,
      stock: stockTransactions,
      exportedAt: new Date().toISOString()
    };
    
    // 2. Call API
    const res = await api.github.backup(fullData);
    if (!res.success) throw new Error(res.error);
  };

  const handleRestoreFromGithub = async () => {
    const res = await api.github.restore();
    if (!res.success) throw new Error(res.error);
    
    // Data is already saved to DB in restore() method, just refresh state
    await refreshData();
  };

  if (!appReady) {
    return <div className="h-screen flex items-center justify-center bg-slate-100"><Loader2 className="animate-spin text-blue-600" size={48}/></div>;
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} loading={loading} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout} activeTab={activeTab} setActiveTab={setActiveTab}>
      {loading && <LoadingOverlay />}
      
      {user.role === UserRole.ADMIN && activeTab === 'dashboard' && (
        <AdminDashboard 
          requests={requests}
          products={products} 
          onUpdateStatus={handleStatusUpdate} 
          onDeleteRequest={handleDeleteRequest}
          onEditRequest={handleEditRequest}
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'warehouse' && (
        <AdminWarehouse 
           users={users}
           products={products}
           stockTransactions={stockTransactions}
           onAddStock={handleAddStock}
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'statistics' && (
        <AdminStats requests={requests} users={users} />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'organizations' && (
        <AdminUsers 
          users={users} 
          requests={requests} 
          onAddUser={handleAddUser} 
          onUpdateUser={handleUpdateUser}
          onDeleteUser={handleDeleteUser} 
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'products' && (
        <AdminProducts 
          products={products} 
          onAddProduct={handleAddProduct} 
          onUpdateProduct={handleUpdateProduct}
          onDeleteProduct={handleDeleteProduct} 
        />
      )}
      {user.role === UserRole.ADMIN && activeTab === 'settings' && (
        <AdminSettings 
           config={telegramConfig} 
           onSave={handleUpdateTelegramConfig} 
           githubConfig={githubConfig}
           onSaveGithub={handleUpdateGithubConfig}
           onBackup={handleBackupToGithub}
           onRestore={handleRestoreFromGithub}
        />
      )}
      
      {/* ORGANIZATION VIEWS */}
      {user.role === UserRole.ORG && activeTab === 'new-request' && (
        <OrgRequestForm user={user} products={products} onSubmit={handleCreateRequest} />
      )}
      {user.role === UserRole.ORG && activeTab === 'warehouse' && (
        <OrgWarehouse 
           user={user}
           products={products}
           stockTransactions={stockTransactions}
           onAddTransaction={handleOrgConsumption}
        />
      )}
      {user.role === UserRole.ORG && activeTab === 'statistics' && (
        <OrgStats 
          requests={requests.filter(r => r.orgId === user.id)}
        />
      )}
      {user.role === UserRole.ORG && activeTab === 'history' && (
        <OrgHistory requests={requests.filter(r => r.orgId === user.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())} />
      )}
    </Layout>
  );
}
