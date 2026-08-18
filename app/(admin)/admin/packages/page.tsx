"use client";

import { useState, useEffect } from "react";
import { Package, Plus, Edit, Trash2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPkg, setEditingPkg] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    messageLimit: 0,
    validity: 30,
    popular: false,
    buttonText: "Get Started",
    features: "",
    isActive: true
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPackages = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const res = await fetch("/api/admin/packages");
      const json = await res.json();
      
      if (json.success) {
        setPackages(json.data.packages);
      } else {
        setError(json.error?.message || "Failed to load packages");
      }
    } catch (err) {
      setError("An unexpected error occurred while loading packages.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openCreateModal = () => {
    setEditingPkg(null);
    setFormData({ name: "", price: 0, messageLimit: 0, validity: 30, popular: false, buttonText: "Get Started", features: "", isActive: true });
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (pkg: any) => {
    setEditingPkg(pkg);
    setFormData({
      name: pkg.name,
      price: pkg.price,
      messageLimit: pkg.messageLimit,
      validity: pkg.validity || 30,
      popular: pkg.popular || false,
      buttonText: pkg.buttonText || "Get Started",
      features: pkg.features.join(", "),
      isActive: pkg.isActive
    });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the "${name}" package? This action cannot be undone.`)) return;
    
    try {
      const res = await fetch(`/api/admin/packages/${id}`, { method: "DELETE" });
      const json = await res.json();
      
      if (json.success) {
        setPackages(packages.filter(p => p._id !== id));
      } else {
        alert(json.error?.message || "Failed to delete package");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const pkg = packages.find(p => p._id === id);
      if (!pkg) return;
      
      const res = await fetch(`/api/admin/packages/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...pkg,
          isActive: !currentStatus
        })
      });
      
      const json = await res.json();
      if (json.success) {
        setPackages(packages.map(p => p._id === id ? { ...p, isActive: !currentStatus } : p));
      } else {
        alert(json.error?.message || "Failed to update package");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);
    
    try {
      const featuresArray = formData.features
        .split(",")
        .map(f => f.trim())
        .filter(f => f.length > 0);
        
      const payload = {
        name: formData.name,
        price: Number(formData.price),
        messageLimit: Number(formData.messageLimit),
        validity: Number(formData.validity),
        popular: formData.popular,
        buttonText: formData.buttonText,
        features: featuresArray,
        isActive: formData.isActive
      };
      
      const url = editingPkg ? `/api/admin/packages/${editingPkg._id}` : "/api/admin/packages";
      const method = editingPkg ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const json = await res.json();
      
      if (json.success) {
        setIsModalOpen(false);
        fetchPackages();
      } else {
        setFormError(json.error?.message || "Failed to save package");
      }
    } catch (err) {
      setFormError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-100">Package Management</h1>
          <p className="text-zinc-400 mt-1">Manage subscription tiers and pricing limits.</p>
        </div>
        
        <button 
          onClick={openCreateModal}
          className="flex items-center justify-center gap-2 w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md font-medium transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Create Package
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 p-6 h-96 animate-pulse" />
      ) : error ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 p-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-80" />
          <h3 className="text-lg font-semibold text-destructive mb-2">Error loading packages</h3>
          <p className="text-destructive/80 mb-6">{error}</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/10 bg-zinc-950/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm text-left">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Package Name</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Price</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Message Limit</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">Features</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {packages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                      No packages found. Click "Create Package" to add one.
                    </td>
                  </tr>
                ) : (
                  packages.map((pkg) => (
                    <tr key={pkg._id} className="hover:bg-white/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-zinc-100 flex items-center gap-2">
                        <Package className="h-4 w-4 text-indigo-400" />
                        {pkg.name}
                      </td>
                      <td className="px-4 py-3">${pkg.price.toFixed(2)}/mo</td>
                      <td className="px-4 py-3">{pkg.messageLimit.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                          pkg.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-destructive/20 text-destructive'
                        }`}>
                          {pkg.isActive ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                          {pkg.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400 max-w-[200px] truncate">
                        {pkg.features.join(", ") || "None"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleToggleActive(pkg._id, pkg.isActive)}
                            className="text-xs font-medium text-zinc-400 hover:text-zinc-100 px-2 py-1"
                            aria-label={pkg.isActive ? `Deactivate package ${pkg.name}` : `Activate package ${pkg.name}`}
                          >
                            {pkg.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => openEditModal(pkg)}
                            className="p-1.5 text-zinc-400 hover:text-indigo-400 transition-colors"
                            title="Edit"
                            aria-label={`Edit package ${pkg.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(pkg._id, pkg.name)}
                            className="p-1.5 text-zinc-400 hover:text-destructive transition-colors"
                            title="Delete"
                            aria-label={`Delete package ${pkg.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
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
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-white/10 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-zinc-900/50">
              <h2 className="text-lg font-semibold text-zinc-100">
                {editingPkg ? "Edit Package" : "Create New Package"}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 text-sm rounded bg-destructive/20 text-destructive border border-destructive/30">
                  {formError}
                </div>
              )}
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Package Name</label>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full h-10 px-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  placeholder="e.g. Starter Plan"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">Price ($/mo)</label>
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">Message Limit</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.messageLimit}
                    onChange={e => setFormData({...formData, messageLimit: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">Validity (Days)</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={formData.validity}
                    onChange={e => setFormData({...formData, validity: Number(e.target.value)})}
                    className="w-full h-10 px-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-300">Button Text</label>
                  <input
                    required
                    type="text"
                    value={formData.buttonText}
                    onChange={e => setFormData({...formData, buttonText: e.target.value})}
                    className="w-full h-10 px-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-zinc-300">Features (comma separated)</label>
                <textarea
                  value={formData.features}
                  onChange={e => setFormData({...formData, features: e.target.value})}
                  className="w-full h-20 p-3 rounded border border-white/10 bg-black text-zinc-100 focus:border-indigo-500 focus:outline-none resize-none"
                  placeholder="Basic Analytics, Email Support..."
                />
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
                  className="rounded border-white/10 bg-black text-indigo-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-zinc-300">
                  Package is active and available
                </label>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="popular"
                  checked={formData.popular}
                  onChange={e => setFormData({...formData, popular: e.target.checked})}
                  className="rounded border-white/10 bg-black text-indigo-500"
                />
                <label htmlFor="popular" className="text-sm font-medium text-zinc-300">
                  Mark as Popular (Highlight visually)
                </label>
              </div>
              
              <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="border-white/10 text-zinc-300 hover:text-white">
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white hover:bg-indigo-500">
                  {isSubmitting ? "Saving..." : "Save Package"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
