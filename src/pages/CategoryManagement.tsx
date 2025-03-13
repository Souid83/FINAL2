import React, { useState, useEffect, useRef } from 'react';
import { useCategoryStore } from '../store/categoryStore';
import { Download, Upload, Trash2, Plus } from 'lucide-react';

export const CategoryManagement: React.FC = () => {
  const { categories, isLoading, error, fetchCategories, addCategory, addCategories, deleteCategory } = useCategoryStore();
  const [newCategory, setNewCategory] = useState({
    type: '',
    brand: '',
    model: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        await fetchCategories();
      } catch (error) {
        console.error('Failed to load categories:', error);
      }
    };
    
    loadCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addCategory(newCategory);
      setNewCategory({ type: '', brand: '', model: '' });
    } catch (error) {
      console.error('Error adding category:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1); // Skip header row
      const categories = rows
        .filter(row => row.trim()) // Skip empty rows
        .map(row => {
          const [type, brand, model] = row.split(',').map(field => field.trim());
          return { type, brand, model };
        });

      await addCategories(categories);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing CSV:', error);
    }
  };

  const downloadSampleCSV = () => {
    const csvContent = 'Type,Brand,Model\nSMARTPHONE,APPLE,IPHONE 14\nSMARTPHONE,SAMSUNG,GALAXY S23';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'categories_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestion des catégories</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download size={18} />
            Télécharger exemple CSV
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer">
            <Upload size={18} />
            Importer CSV
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
            />
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {/* Add Category Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Ajouter une catégorie</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nature du produit
            </label>
            <input
              type="text"
              value={newCategory.type}
              onChange={(e) => setNewCategory(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="ex: SMARTPHONE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque
            </label>
            <input
              type="text"
              value={newCategory.brand}
              onChange={(e) => setNewCategory(prev => ({ ...prev, brand: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="ex: APPLE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle
            </label>
            <input
              type="text"
              value={newCategory.model}
              onChange={(e) => setNewCategory(prev => ({ ...prev, model: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="ex: IPHONE 14"
            />
          </div>
          <div className="col-span-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              <Plus size={18} />
              {isLoading ? 'Ajout en cours...' : 'Ajouter la catégorie'}
            </button>
          </div>
        </form>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg shadow">
        <div className="max-h-[calc(100vh-24rem)] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="sticky top-0 bg-gray-50 px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Nature du produit
                </th>
                <th className="sticky top-0 bg-gray-50 px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Marque
                </th>
                <th className="sticky top-0 bg-gray-50 px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Modèle
                </th>
                <th className="sticky top-0 bg-gray-50 px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.brand}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {category.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <button
                      onClick={() => deleteCategory(category.id)}
                      className="text-red-600 hover:text-red-800"
                      disabled={isLoading}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    Aucune catégorie trouvée
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-center text-gray-600">Chargement...</p>
          </div>
        </div>
      )}
    </div>
  );
};