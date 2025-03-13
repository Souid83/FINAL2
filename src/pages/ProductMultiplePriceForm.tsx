import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';
import { useProductStore } from '../store/productStore';
import { useCategoryStore } from '../store/categoryStore';
import { useVariantStore } from '../store/variantStore';
import { ImageManager } from '../components/Products/ImageManager';

export const ProductMultiplePriceForm: React.FC = () => {
  const { addProduct } = useProductStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
  const { variants, fetchVariants } = useVariantStore();
  const { navigateToProduct } = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    weight_grams: '',
    localisation: '',
    ean: '',
    stock: '',
    stock_alert: '',
    description: '',
    width_cm: '',
    height_cm: '',
    depth_cm: ''
  });

  const [selectedCategory, setSelectedCategory] = useState({
    type: '',
    brand: '',
    model: ''
  });

  const [selectedVariants, setSelectedVariants] = useState<{
    color: string;
    grade: string;
    capacity: string;
  }[]>([{
    color: '',
    grade: '',
    capacity: ''
  }]);

  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchVariants();
  }, [fetchCategories, fetchVariants]);

  // Get unique values for category dropdowns
  const uniqueTypes = Array.from(new Set(categories.map(c => c.type))).sort();
  const uniqueBrands = Array.from(new Set(categories
    .filter(c => !selectedCategory.type || c.type === selectedCategory.type)
    .map(c => c.brand)
  )).sort();
  const uniqueModels = Array.from(new Set(categories
    .filter(c => 
      (!selectedCategory.type || c.type === selectedCategory.type) && 
      (!selectedCategory.brand || c.brand === selectedCategory.brand)
    )
    .map(c => c.model)
  )).sort();

  // Get unique values for variant dropdowns
  const uniqueColors = Array.from(new Set(variants.map(v => v.color))).sort();
  const uniqueGrades = Array.from(new Set(variants.map(v => v.grade))).sort();
  const uniqueCapacities = Array.from(new Set(variants.map(v => v.capacity))).sort();

  const handleCategoryChange = (field: keyof typeof selectedCategory, value: string) => {
    const upperValue = value.toUpperCase();
    setSelectedCategory(prev => {
      const newData = { ...prev, [field]: upperValue };
      if (field === 'type') {
        newData.brand = '';
        newData.model = '';
      } else if (field === 'brand') {
        newData.model = '';
      }
      return newData;
    });

    if (value) {
      const parts = [
        field === 'type' ? upperValue : selectedCategory.type,
        field === 'brand' ? upperValue : selectedCategory.brand,
        field === 'model' ? upperValue : selectedCategory.model
      ].filter(Boolean);
      
      if (parts.length > 0) {
        setFormData(prev => ({
          ...prev,
          name: parts.join(' ')
        }));
      }
    }
  };

  const handleVariantChange = (index: number, field: keyof (typeof selectedVariants)[0], value: string) => {
    const newVariants = [...selectedVariants];
    value = value.toUpperCase();
    newVariants[index] = {
      ...newVariants[index],
      [field]: value
    };
    setSelectedVariants(newVariants);
  };

  const addVariant = () => {
    setSelectedVariants([...selectedVariants, {
      color: '',
      grade: '',
      capacity: ''
    }]);
  };

  const removeVariant = (index: number) => {
    setSelectedVariants(selectedVariants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create category if it doesn't exist
      if (selectedCategory.type && selectedCategory.brand && selectedCategory.model) {
        try {
          await addCategory({
            type: selectedCategory.type,
            brand: selectedCategory.brand,
            model: selectedCategory.model
          });
        } catch (error) {
          console.log('Category might already exist:', error);
        }
      }

      // Create base product
      const productData = {
        name: formData.name,
        sku: formData.sku,
        purchase_price: 0,
        retail_price: 0,
        pro_price: 0,
        weight_grams: parseInt(formData.weight_grams),
        location: formData.localisation.toUpperCase(),
        ean: formData.ean,
        stock: parseInt(formData.stock),
        stock_alert: formData.stock_alert ? parseInt(formData.stock_alert) : null,
        description: formData.description,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        depth_cm: formData.depth_cm ? parseFloat(formData.depth_cm) : null,
        images: productImages,
        category_id: null,
        variants: selectedVariants
      };

      await addProduct(productData);
      navigateToProduct('product-list');
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigateToProduct('select-type')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold">Ajouter un produit (Prix d'achat multiple)</h2>

        {/* Category Selection */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Catégorie du produit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nature du produit
              </label>
              <select
                value={selectedCategory.type}
                onChange={(e) => handleCategoryChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Sélectionner la nature</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marque
              </label>
              <select
                value={selectedCategory.brand}
                onChange={(e) => handleCategoryChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={!selectedCategory.type}
              >
                <option value="">Sélectionner la marque</option>
                {uniqueBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modèle
              </label>
              <select
                value={selectedCategory.model}
                onChange={(e) => handleCategoryChange('model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={!selectedCategory.brand}
              >
                <option value="">Sélectionner le modèle</option>
                {uniqueModels.map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Basic Product Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom du produit
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU
            </label>
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <input
              type="text"
              value={formData.localisation}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                localisation: e.target.value.toUpperCase() 
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="EMPLACEMENT"
            />
          </div>
        </div>

        {/* Product Variants */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Variantes du produit</h3>
            <button
              type="button"
              onClick={addVariant}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Ajouter une variante
            </button>
          </div>
          
          {selectedVariants.map((variant, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Couleur
                  </label>
                  <select
                    value={variant.color}
                    onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    required
                  >
                    <option value="">Sélectionner une couleur</option>
                    {uniqueColors.map(color => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grade
                  </label>
                  <select
                    value={variant.grade}
                    onChange={(e) => handleVariantChange(index, 'grade', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    required
                  >
                    <option value="">Sélectionner un grade</option>
                    {uniqueGrades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Capacité
                  </label>
                  <select
                    value={variant.capacity}
                    onChange={(e) => handleVariantChange(index, 'capacity', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                    required
                  >
                    <option value="">Sélectionner une capacité</option>
                    {uniqueCapacities.map(capacity => (
                      <option key={capacity} value={capacity}>{capacity}</option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedVariants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="mt-4 text-red-600 hover:text-red-800"
                >
                  Supprimer cette variante
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Product Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EAN
            </label>
            <input
              type="text"
              value={formData.ean}
              onChange={(e) => setFormData(prev => ({ ...prev, ean: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poids (grammes)
            </label>
            <input
              type="number"
              value={formData.weight_grams}
              onChange={(e) => setFormData(prev => ({ ...prev, weight_grams: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        {/* Dimensions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensions du produit
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <input
                type="number"
                value={formData.width_cm}
                onChange={(e) => setFormData(prev => ({ ...prev, width_cm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Largeur (cm)"
                step="0.1"
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.height_cm}
                onChange={(e) => setFormData(prev => ({ ...prev, height_cm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Hauteur (cm)"
                step="0.1"
              />
            </div>
            <div>
              <input
                type="number"
                value={formData.depth_cm}
                onChange={(e) => setFormData(prev => ({ ...prev, depth_cm: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Profondeur (cm)"
                step="0.1"
              />
            </div>
          </div>
        </div>

        {/* Stock Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock actuel
            </label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerte stock
            </label>
            <input
              type="number"
              value={formData.stock_alert}
              onChange={(e) => setFormData(prev => ({ ...prev, stock_alert: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
          />
        </div>

        {/* Image Management */}
        <div>
          <button
            type="button"
            onClick={() => setIsImageManagerOpen(true)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Gestion des images ({productImages.length})
          </button>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Ajouter le produit
          </button>
        </div>
      </form>

      <ImageManager
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        onImagesChange={setProductImages}
        currentImages={productImages}
      />
    </div>
  );
};