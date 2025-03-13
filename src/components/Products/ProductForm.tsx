import React, { useState, useEffect, useRef } from 'react';
import { useProductStore } from '../../store/productStore';
import { useCategoryStore } from '../../store/categoryStore';
import { ImageManager } from './ImageManager';
import { Image as ImageIcon, Download, Upload, Plus } from 'lucide-react';

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
    purchase_price: number;
    retail_price: number;
    pro_price: number;
    weight_grams: number;
    localisation?: string;
    ean: string | null;
    stock: number;
    stock_alert: number | null;
    description: string | null;
    width_cm?: number | null;
    height_cm?: number | null;
    depth_cm?: number | null;
    images?: string[];
    variants?: {
      color: string;
      grade: string;
      capacity: string;
    }[];
  };
  onSubmitSuccess?: () => void;
  showImageManager?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({
  initialProduct,
  onSubmitSuccess,
  showImageManager = false
}) => {
  const { addProduct, updateProduct, addProducts } = useProductStore();
  const { categories, fetchCategories, addCategory } = useCategoryStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: initialProduct?.name || '',
    sku: initialProduct?.sku || '',
    purchase_price: initialProduct?.purchase_price?.toString() || '',
    weight_grams: initialProduct?.weight_grams?.toString() || '',
    localisation: initialProduct?.localisation || '',
    ean: initialProduct?.ean || '',
    stock: initialProduct?.stock?.toString() || '',
    stock_alert: initialProduct?.stock_alert?.toString() || '',
    description: initialProduct?.description || '',
    width_cm: initialProduct?.width_cm?.toString() || '',
    height_cm: initialProduct?.height_cm?.toString() || '',
    depth_cm: initialProduct?.depth_cm?.toString() || ''
  });

  // Extract category from product name if it exists
  const getInitialCategory = () => {
    if (!initialProduct?.name) return { type: '', brand: '', model: '' };
    const parts = initialProduct.name.split(' ');
    if (parts.length < 3) return { type: '', brand: '', model: '' };
    return {
      type: parts[0],
      brand: parts[1],
      model: parts.slice(2).join(' ')
    };
  };

  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory());

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

  // Get unique values for dropdowns
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

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    setIsImageManagerOpen(showImageManager);
  }, [showImageManager]);

  useEffect(() => {
    const purchasePrice = parseFloat(formData.purchase_price);
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
  }, [formData.purchase_price]);

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
    field: 'ht' | 'margin' | 'ttc',
    value: string
  ) => {
    const purchasePrice = parseFloat(formData.purchase_price);
    const setPrices = type === 'retail' ? setRetailPrice : setProPrice;

    if (!value) {
      setPrices({ ht: '', margin: '', ttc: '' });
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || isNaN(purchasePrice)) return;

    switch (field) {
      case 'ht':
        setPrices({
          ht: value,
          margin: calculateMargin(purchasePrice, numValue).toFixed(2),
          ttc: calculateTTC(numValue).toFixed(2)
        });
        break;
      case 'margin':
        const priceHT = calculatePriceFromMargin(purchasePrice, numValue);
        setPrices({
          ht: priceHT.toFixed(2),
          margin: value,
          ttc: calculateTTC(priceHT).toFixed(2)
        });
        break;
      case 'ttc':
        const ht = calculateHT(numValue);
        setPrices({
          ht: ht.toFixed(2),
          margin: calculateMargin(purchasePrice, ht).toFixed(2),
          ttc: value
        });
        break;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const rows = text.split('\n').slice(1); // Skip header row
      const products = [];

      for (const row of rows.filter(row => row.trim())) {
        const [
          type,
          brand,
          model,
          name,
          sku,
          purchase_price,
          retail_price,
          pro_price,
          weight_grams,
          localisation,
          ean,
          stock,
          stock_alert,
          description,
          width_cm,
          height_cm,
          depth_cm
        ] = row.split(',').map(field => field.trim());

        // Create category if it doesn't exist
        const categoryData = {
          type: type.toUpperCase(),
          brand: brand.toUpperCase(),
          model: model.toUpperCase()
        };

        try {
          await addCategory(categoryData);
        } catch (error) {
          console.log('Category might already exist:', error);
        }

        products.push({
          name,
          sku,
          purchase_price: parseFloat(purchase_price),
          retail_price: parseFloat(retail_price),
          pro_price: parseFloat(pro_price),
          weight_grams: parseInt(weight_grams),
          location: localisation ? localisation.toUpperCase() : null,
          ean: ean || null,
          stock: parseInt(stock),
          stock_alert: stock_alert ? parseInt(stock_alert) : null,
          description: description || null,
          width_cm: width_cm ? parseFloat(width_cm) : null,
          height_cm: height_cm ? parseFloat(height_cm) : null,
          depth_cm: depth_cm ? parseFloat(depth_cm) : null,
          images: []
        });
      }

      await addProducts(products);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error processing CSV:', error);
    }
  };

  const downloadSampleCSV = () => {
    const headers = [
      'type',
      'brand',
      'model',
      'name',
      'sku',
      'purchase_price',
      'retail_price',
      'pro_price',
      'weight_grams',
      'localisation',
      'ean',
      'stock',
      'stock_alert',
      'description',
      'width_cm',
      'height_cm',
      'depth_cm'
    ].join(',');

    const sampleData = [
      'SMARTPHONE,APPLE,IPHONE 14,iPhone 14 Pro 128Go Noir,IP14P-128-BLK,899.99,1159.99,1059.99,240,A1-B2,123456789012,5,2,"iPhone 14 Pro 128Go coloris noir",7.85,16.07,0.78',
      'SMARTPHONE,SAMSUNG,GALAXY S23,Samsung Galaxy S23 256Go Vert,SGS23-256-GRN,849.99,1099.99,999.99,234,C3-D4,123456789013,3,1,"Samsung Galaxy S23 256Go coloris vert",7.6,15.8,0.8'
    ].join('\n');

    const csvContent = `${headers}\n${sampleData}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'products_sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

      const productData = {
        name: formData.name,
        sku: formData.sku,
        purchase_price: parseFloat(formData.purchase_price),
        retail_price: parseFloat(retailPrice.ht),
        pro_price: parseFloat(proPrice.ht),
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
        variants: initialProduct?.variants || null
      };

      if (initialProduct) {
        await updateProduct(initialProduct.id, productData);
      } else {
        await addProduct(productData);
      }

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

      if (!initialProduct) {
        setFormData({
          name: '',
          sku: '',
          purchase_price: '',
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
        setRetailPrice({ ht: '', margin: '', ttc: '' });
        setProPrice({ ht: '', margin: '', ttc: '' });
        setProductImages([]);
        setSelectedCategory({ type: '', brand: '', model: '' });
      }
    } catch (error) {
      console.error('Failed to save product:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">
          {initialProduct ? 'Modifier le produit' : 'Ajouter un produit'}
        </h2>
        <div className="flex items-center gap-4">
          <button
            type="button"
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
            name="localisation"
            value={formData.localisation}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              localisation: e.target.value.toUpperCase() 
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
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Poids (grammes)
          </label>
          <input
            type="number"
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
              type="number"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleChange}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="Prix d'achat"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
              HT
            </span>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix de vente magasin
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="number"
                value={retailPrice.ht}
                onChange={(e) => updatePriceInputs('retail', 'ht', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md"
                placeholder="Prix"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                HT
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={retailPrice.margin}
                onChange={(e) => updatePriceInputs('retail', 'margin', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-green-600"
                placeholder="Marge"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                %
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={retailPrice.ttc}
                onChange={(e) => updatePriceInputs('retail', 'ttc', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                placeholder="Prix"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                TTC
              </span>
            </div>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix de vente pro
          </label>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="number"
                value={proPrice.ht}
                onChange={(e) => updatePriceInputs('pro', 'ht', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md"
                placeholder="Prix"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                HT
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={proPrice.margin}
                onChange={(e) => updatePriceInputs('pro', 'margin', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-green-600"
                placeholder="Marge"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                %
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={proPrice.ttc}
                onChange={(e) => updatePriceInputs('pro', 'ttc', e.target.value)}
                step="0.01"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md"
                placeholder="Prix"
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
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="number"
                name="width_cm"
                value={formData.width_cm}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
                placeholder="Largeur"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                cm
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                name="height_cm"
                value={formData.height_cm}
                onChange={handleChange}
                step="0.1"
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
                placeholder="Hauteur"
              />
              <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                cm
              </span>
            </div>
            <div className="relative">
              <input
                type="number"
                name="depth_cm"
                value={formData.depth_cm}
                onChange={handleChange}
                step="0.1"
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
              Stock actuel
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
              placeholder="Quantité en stock"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alerte stock
            </label>
            <input
              type="number"
              name="stock_alert"
              value={formData.stock_alert}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Seuil d'alerte"
              min="0"
            />
          </div>
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
          placeholder="Description du produit"
        />
      </div>

      {/* Display variants if they exist */}
      {initialProduct?.variants && initialProduct.variants.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Variantes du produit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="font-medium text-gray-700">Couleur</div>
            <div className="font-medium text-gray-700">Grade</div>
            <div className="font-medium text-gray-700">Capacité</div>
            {initialProduct.variants.map((variant, index) => (
              <React.Fragment key={index}>
                <div className="text-gray-900">{variant.color}</div>
                <div className="text-gray-900">{variant.grade}</div>
                <div className="text-gray-900">{variant.capacity}</div>
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

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
    </form>
  );
};