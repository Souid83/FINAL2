import React, { useState, useEffect, useRef } from 'react';
import { useProductStore } from '../../store/productStore';
import { useCategoryStore } from '../../store/categoryStore';
import { ImageManager } from './ImageManager';
import { Image as ImageIcon } from 'lucide-react';
import { StockAllocationModal } from './StockAllocationModal';

const TVA_RATE = 0.20;

interface PriceInputs {
  ht: string;
  margin: string;
  ttc: string;
}

interface ProductFormProps {
  initialProduct?: {
    id: string;
    name: string;
    sku: string;
    purchase_price_with_fees: number;
    retail_price: number;
    pro_price: number;
    weight_grams: number;
    location?: string;
    ean: string | null;
    stock: number;
    stock_alert: number | null;
    description: string | null;
    width_cm?: number | null;
    height_cm?: number | null;
    depth_cm?: number | null;
    images?: string[];
    category?: {
      type: string;
      brand: string;
      model: string;
    } | null;
  };
  onSubmitSuccess?: () => void;
  showImageManager?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialProduct,
  onSubmitSuccess,
  showImageManager = false
}) => {
  const { addProduct, updateProduct } = useProductStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    sku: initialProduct?.sku || '',
    purchase_price_with_fees: initialProduct?.purchase_price_with_fees?.toString() || '',
    weight_grams: initialProduct?.weight_grams?.toString() || '',
    location: initialProduct?.location || '',
    ean: initialProduct?.ean || '',
    stock: initialProduct?.stock?.toString() || '',
    stock_alert: initialProduct?.stock_alert?.toString() || '',
    description: initialProduct?.description || '',
    width_cm: initialProduct?.width_cm?.toString() || '',
    height_cm: initialProduct?.height_cm?.toString() || '',
    depth_cm: initialProduct?.depth_cm?.toString() || ''
  });

  const [selectedCategory, setSelectedCategory] = useState({
    type: initialProduct?.category?.type || '',
    brand: initialProduct?.category?.brand || '',
    model: initialProduct?.category?.model || ''
  });

  const [retailPrice, setRetailPrice] = useState<PriceInputs>({
    ht: initialProduct?.retail_price?.toString() || '',
    margin: '',
    ttc: ''
  });

  const [proPrice, setProPrice] = useState<PriceInputs>({
    ht: initialProduct?.pro_price?.toString() || '',
    margin: '',
    ttc: ''
  });

  const [isImageManagerOpen, setIsImageManagerOpen] = useState(showImageManager);
  const [productImages, setProductImages] = useState<string[]>(initialProduct?.images || []);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [newProductId, setNewProductId] = useState<string | null>(null);
  const [newProductName, setNewProductName] = useState('');
  const [globalStock, setGlobalStock] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setIsImageManagerOpen(showImageManager);
  }, [showImageManager]);

  useEffect(() => {
    const purchasePrice = parseFloat(formData.purchase_price_with_fees);
    if (!isNaN(purchasePrice) && purchasePrice > 0) {
      if (retailPrice.ht) {
        const retailHT = parseFloat(retailPrice.ht);
        if (!isNaN(retailHT)) {
          setRetailPrice(prev => ({
            ...prev,
            margin: calculateMargin(purchasePrice, retailHT).toFixed(2),
            ttc: calculateTTC(retailHT).toFixed(2)
          }));
        }
      }

      if (proPrice.ht) {
        const proHT = parseFloat(proPrice.ht);
        if (!isNaN(proHT)) {
          setProPrice(prev => ({
            ...prev,
            margin: calculateMargin(purchasePrice, proHT).toFixed(2),
            ttc: calculateTTC(proHT).toFixed(2)
          }));
        }
      }
    }
  }, [formData.purchase_price_with_fees]);

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

  const calculateHT = (ttc: number): number => {
    return ttc / (1 + TVA_RATE);
  };

  const calculateTTC = (ht: number): number => {
    return ht * (1 + TVA_RATE);
  };

  const calculatePriceFromMargin = (purchasePrice: number, margin: number): number => {
    return purchasePrice * (1 + margin / 100);
  };

  const calculateMargin = (purchasePrice: number, sellingPrice: number): number => {
    return ((sellingPrice - purchasePrice) / purchasePrice) * 100;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Allow all characters for description
    if (name === 'description') {
      setFormData(prev => ({ ...prev, [name]: value }));
      return;
    }

    // For numeric fields, only allow numbers
    const numericFields = [
      'ean',
      'weight_grams',
      'stock',
      'stock_alert',
      'width_cm',
      'height_cm',
      'depth_cm',
      'purchase_price_with_fees'
    ];

    if (numericFields.includes(name)) {
      if (/^\d*$/.test(value)) { // Only allow numbers
        setFormData(prev => ({ ...prev, [name]: value }));
      }
      return;
    }

    // For all other fields
    setFormData(prev => ({ ...prev, [name]: value }));
  };

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
};


  const updatePriceInputs = (
    type: 'retail' | 'pro',
    field: 'price' | 'margin_percent' | 'margin_amount',
    value: string
  ) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers

    const purchasePrice = parseFloat(formData.purchase_price_with_fees);
    if (isNaN(purchasePrice) || purchasePrice <= 0) return;

    const numValue = parseFloat(value);
    const setPrices = type === 'retail' ? setRetailPrice : setProPrice;

    if (!value) {
      setPrices({ ht: '', margin: '', ttc: '' });
      return;
    }

    if (isNaN(numValue)) return;

    switch (field) {
      case 'price':
        setPrices({
          ht: value,
          margin: calculateMargin(purchasePrice, numValue).toFixed(2),
          ttc: calculateTTC(numValue).toFixed(2)
        });
        break;
      case 'margin_percent':
        const priceHT = calculatePriceFromMargin(purchasePrice, numValue);
        setPrices({
          ht: priceHT.toFixed(2),
          margin: value,
          ttc: calculateTTC(priceHT).toFixed(2)
        });
        break;
      case 'margin_amount':
        const ht = calculateHT(numValue);
        setPrices({
          ht: ht.toFixed(2),
          margin: calculateMargin(purchasePrice, ht).toFixed(2),
          ttc: value
        });
        break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate category selection
    if (!selectedCategory.type || !selectedCategory.brand || !selectedCategory.model) {
      setError('Veuillez sélectionner une catégorie complète (Nature, Marque et Modèle)');
      return;
    }

    // Validate numeric fields
    const numericFields = [
      { name: 'ean', label: 'Code EAN' },
      { name: 'weight_grams', label: 'Poids' },
      { name: 'stock', label: 'Stock' },
      { name: 'purchase_price_with_fees', label: "Prix d'achat" }
    ];

    for (const field of numericFields) {
      const value = formData[field.name as keyof typeof formData];
      if (!value || !/^\d+$/.test(value)) {
        setError(`Le champ ${field.label} est requis et doit contenir uniquement des chiffres.`);
        return;
      }
    }

    try {
      let categoryId = null;
      
      // Category is now guaranteed to be complete
      const category = await addCategory({
        type: selectedCategory.type,
        brand: selectedCategory.brand,
        model: selectedCategory.model
      });
      
      if (category) {
        categoryId = category.id;
      }

      const productData = {
        name: formData.name,
        sku: formData.sku,
        purchase_price_with_fees: parseFloat(formData.purchase_price_with_fees),
        retail_price: parseFloat(retailPrice.ht || '0'),
        pro_price: parseFloat(proPrice.ht || '0'),
        weight_grams: parseInt(formData.weight_grams),
        location: formData.location.toUpperCase(),
        ean: formData.ean,
        stock: parseInt(formData.stock),
        stock_alert: formData.stock_alert ? parseInt(formData.stock_alert) : null,
        description: formData.description || null,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        depth_cm: formData.depth_cm ? parseFloat(formData.depth_cm) : null,
        images: productImages,
        category_id: categoryId
      };

      if (initialProduct) {
        await updateProduct(initialProduct.id, productData);
        if (onSubmitSuccess) {
          onSubmitSuccess();
        }
      } else {
        const result = await addProduct(productData);
        if (result?.id) {
          setNewProductId(result.id);
          setNewProductName(result.name);
          setGlobalStock(parseInt(formData.stock));
          setIsStockModalOpen(true);
        }
      }

      if (!initialProduct) {
        setFormData({
          name: '',
          sku: '',
          purchase_price_with_fees: '',
          weight_grams: '',
          location: '',
          ean: '',
          stock: '',
          stock_alert: '',
          description: '',
          width_cm: '',
          height_cm: '',
          depth_cm: ''
        });
        setSelectedCategory({ type: '', brand: '', model: '' });
        setRetailPrice({ ht: '', margin: '', ttc: '' });
        setProPrice({ ht: '', margin: '', ttc: '' });
        setProductImages([]);
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      setError('Une erreur est survenue lors de l\'enregistrement du produit.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {initialProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Catégorie du produit</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nature du produit <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory.type}
              onChange={(e) => handleCategoryChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              required
            >
              <option value="">Sélectionner la nature</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marque <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory.brand}
              onChange={(e) => handleCategoryChange('brand', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              disabled={!selectedCategory.type}
              required
            >
              <option value="">Sélectionner la marque</option>
              {uniqueBrands.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modèle <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCategory.model}
              onChange={(e) => handleCategoryChange('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              disabled={!selectedCategory.brand}
              required
            >
              <option value="">Sélectionner le modèle</option>
              {uniqueModels.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du produit
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            placeholder="Nom du produit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU
          </label>
          <input
            type="text"
            name="sku"
            value={formData.sku}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            placeholder="SKU"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localisation
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              location: e.target.value.toUpperCase() 
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="EMPLACEMENT"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EAN
          </label>
          <input
            type="text"
            name="ean"
            value={formData.ean}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Code EAN"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poids (grammes)
          </label>
          <input
            type="text"
            name="weight_grams"
            value={formData.weight_grams}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            placeholder="Poids en grammes"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix d'achat HT
          </label>
          <div className="relative">
            <input
              type="text"
              name="purchase_price_with_fees"
              value={formData.purchase_price_with_fees}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="Prix d'achat"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              HT
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prix de vente magasin
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              value={retailPrice.ht}
              onChange={(e) => updatePriceInputs('retail', 'price', e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md"
              placeholder="Prix HT"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              HT
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={retailPrice.margin}
              onChange={(e) => updatePriceInputs('retail', 'margin_percent', e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-green-600"
              placeholder="Marge"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
              %
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={retailPrice.ttc}
              onChange={(e) => updatePriceInputs('retail', 'margin_amount', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
              placeholder="Prix TTC"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              TTC
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Prix de vente pro
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              value={proPrice.ht}
              onChange={(e) => updatePriceInputs('pro', 'price', e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md"
              placeholder="Prix HT"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              HT
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={proPrice.margin}
              onChange={(e) => updatePriceInputs('pro', 'margin_percent', e.target.value)}
              className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-green-600"
              placeholder="Marge"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
              %
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={proPrice.ttc}
              onChange={(e) => updatePriceInputs('pro', 'margin_amount', e.target.value)}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
              placeholder="Prix TTC"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              TTC
            </span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Dimensions du produit
        </label>
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              name="width_cm"
              value={formData.width_cm}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
              placeholder="Largeur"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              cm
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              name="height_cm"
              value={formData.height_cm}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
              placeholder="Hauteur"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              cm
            </span>
          </div>
          <div className="relative">
            <input
              type="text"
              name="depth_cm"
              value={formData.depth_cm}
              onChange={handleChange}
              className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
              placeholder="Profondeur"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              cm
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Stock global
          </label>
          <input
            type="text"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Alerte stock
          </label>
          <input
            type="text"
            name="stock_alert"
            value={formData.stock_alert}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            min="0"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          rows={3}
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsImageManagerOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <ImageIcon size={20} />
          Gestion des images ({productImages.length})
        </button>
      </div>

      <div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          {initialProduct ? 'Mettre à jour' : 'Ajouter le produit'}
        </button>
      </div>

      <ImageManager
        isOpen={isImageManagerOpen}
        onClose={() => setIsImageManagerOpen(false)}
        onImagesChange={setProductImages}
        currentImages={productImages}
      />

      <StockAllocationModal
        isOpen={isStockModalOpen}
        onClose={() => {
          setIsStockModalOpen(false);
          if (onSubmitSuccess) {
            onSubmitSuccess();
          }
        }}
        productId={newProductId || ''}
        productName={newProductName}
        globalStock={globalStock}
      />
    </form>
  );
};