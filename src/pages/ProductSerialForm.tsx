import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from '../hooks/useNavigate';
import { useProductStore } from '../store/productStore';
import { useCategoryStore } from '../store/categoryStore';
import { useVariantStore } from '../store/variantStore';
import { ImageManager } from '../components/Products/ImageManager';

const VAT_RATE = 0.20; // 20% VAT rate

interface FormData {
  name: string;
  sku: string;
  purchase_price: string;
  purchase_price_2: string;
  retail_price: string;
  retail_margin_percent: string;
  retail_margin_amount: string;
  retail_price_ttc: string;
  pro_price: string;
  pro_margin_percent: string;
  pro_margin_amount: string;
  pro_price_ttc: string;
  weight_grams: string;
  localisation: string;
  ean: string;
  stock: string;
  stock_alert: string;
  description: string;
  width_cm: string;
  height_cm: string;
  depth_cm: string;
  imei: string;
  supplier: string;
  product_note: string;
  selected_stock: string;
  vat_type: 'normal' | 'margin';
  category: {
    type: string;
    brand: string;
    model: string;
  };
  variant: {
    color: string;
    grade: string;
    capacity: string;
  };
}

export const ProductSerialForm: React.FC = () => {
  const { navigateToProduct } = useNavigate();
  const { addProduct } = useProductStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { variants, fetchVariants } = useVariantStore();
  const [isImageManagerOpen, setIsImageManagerOpen] = useState(false);
  const [productImages, setProductImages] = useState<string[]>([]);

  useEffect(() => {
    fetchCategories();
    fetchVariants();
  }, [fetchCategories, fetchVariants]);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    sku: '',
    purchase_price: '',
    purchase_price_2: '',
    retail_price: '',
    retail_margin_percent: '',
    retail_margin_amount: '',
    retail_price_ttc: '',
    pro_price: '',
    pro_margin_percent: '',
    pro_margin_amount: '',
    pro_price_ttc: '',
    weight_grams: '',
    localisation: '',
    ean: '',
    stock: '',
    stock_alert: '',
    description: '',
    width_cm: '',
    height_cm: '',
    depth_cm: '',
    imei: '',
    supplier: '',
    product_note: '',
    selected_stock: '',
    vat_type: 'normal',
    category: {
      type: '',
      brand: '',
      model: ''
    },
    variant: {
      color: '',
      grade: '',
      capacity: ''
    }
  });

  const uniqueTypes = Array.from(new Set(categories.map(c => c.type))).sort();
  const uniqueBrands = Array.from(new Set(categories
    .filter(c => !formData.category.type || c.type === formData.category.type)
    .map(c => c.brand)
  )).sort();
  const uniqueModels = Array.from(new Set(categories
    .filter(c => 
      (!formData.category.type || c.type === formData.category.type) && 
      (!formData.category.brand || c.brand === formData.category.brand)
    )
    .map(c => c.model)
  )).sort();

  const uniqueColors = Array.from(new Set(variants.map(v => v.color))).sort();
  const uniqueGrades = Array.from(new Set(variants.map(v => v.grade))).sort();
  const uniqueCapacities = Array.from(new Set(variants.map(v => v.capacity))).sort();

  const calculateMargins = (
    type: 'retail' | 'pro',
    field: 'price' | 'margin_percent' | 'margin_amount',
    value: string
  ) => {
    const purchasePrice = parseFloat(formData.purchase_price_2) || parseFloat(formData.purchase_price);
    if (isNaN(purchasePrice) || purchasePrice <= 0) return;

    const newFormData = { ...formData };
    const numValue = parseFloat(value);

    if (type === 'retail') {
      if (field === 'price' && !isNaN(numValue)) {
        const marginAmount = numValue - purchasePrice;
        const marginPercent = (marginAmount / purchasePrice) * 100;

        newFormData.retail_price = value;
        newFormData.retail_margin_amount = marginAmount.toFixed(2);
        newFormData.retail_margin_percent = marginPercent.toFixed(2);

        if (formData.vat_type === 'normal') {
          newFormData.retail_price_ttc = (numValue * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.retail_price_ttc = '';
        }
      } else if (field === 'margin_percent' && !isNaN(numValue)) {
        const marginAmount = (purchasePrice * numValue) / 100;
        const sellingPrice = purchasePrice + marginAmount;

        newFormData.retail_price = sellingPrice.toFixed(2);
        newFormData.retail_margin_amount = marginAmount.toFixed(2);
        newFormData.retail_margin_percent = value;

        if (formData.vat_type === 'normal') {
          newFormData.retail_price_ttc = (sellingPrice * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.retail_price_ttc = '';
        }
      } else if (field === 'margin_amount' && !isNaN(numValue)) {
        const sellingPrice = purchasePrice + numValue;
        const marginPercent = (numValue / purchasePrice) * 100;

        newFormData.retail_price = sellingPrice.toFixed(2);
        newFormData.retail_margin_amount = value;
        newFormData.retail_margin_percent = marginPercent.toFixed(2);

        if (formData.vat_type === 'normal') {
          newFormData.retail_price_ttc = (sellingPrice * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.retail_price_ttc = '';
        }
      }
    } else {
      if (field === 'price' && !isNaN(numValue)) {
        const marginAmount = numValue - purchasePrice;
        const marginPercent = (marginAmount / purchasePrice) * 100;

        newFormData.pro_price = value;
        newFormData.pro_margin_amount = marginAmount.toFixed(2);
        newFormData.pro_margin_percent = marginPercent.toFixed(2);

        if (formData.vat_type === 'normal') {
          newFormData.pro_price_ttc = (numValue * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.pro_price_ttc = '';
        }
      } else if (field === 'margin_percent' && !isNaN(numValue)) {
        const marginAmount = (purchasePrice * numValue) / 100;
        const sellingPrice = purchasePrice + marginAmount;

        newFormData.pro_price = sellingPrice.toFixed(2);
        newFormData.pro_margin_amount = marginAmount.toFixed(2);
        newFormData.pro_margin_percent = value;

        if (formData.vat_type === 'normal') {
          newFormData.pro_price_ttc = (sellingPrice * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.pro_price_ttc = '';
        }
      } else if (field === 'margin_amount' && !isNaN(numValue)) {
        const sellingPrice = purchasePrice + numValue;
        const marginPercent = (numValue / purchasePrice) * 100;

        newFormData.pro_price = sellingPrice.toFixed(2);
        newFormData.pro_margin_amount = value;
        newFormData.pro_margin_percent = marginPercent.toFixed(2);

        if (formData.vat_type === 'normal') {
          newFormData.pro_price_ttc = (sellingPrice * (1 + VAT_RATE)).toFixed(2);
        } else {
          newFormData.pro_price_ttc = '';
        }
      }
    }

    setFormData(newFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.category.type && formData.category.brand && formData.category.model) {
        try {
          await addCategory({
            type: formData.category.type,
            brand: formData.category.brand,
            model: formData.category.model
          });
        } catch (error) {
          console.log('Category might already exist:', error);
        }
      }

      const productData = {
        name: formData.name,
        sku: formData.sku,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        purchase_price_2: formData.purchase_price_2 ? parseFloat(formData.purchase_price_2) : null,
        retail_price: parseFloat(formData.retail_price) || 0,
        pro_price: parseFloat(formData.pro_price) || 0,
        weight_grams: parseInt(formData.weight_grams) || 0,
        location: formData.localisation.toUpperCase(),
        ean: formData.ean || null,
        stock: parseInt(formData.stock) || 0,
        stock_alert: formData.stock_alert ? parseInt(formData.stock_alert) : null,
        description: formData.description || null,
        width_cm: formData.width_cm ? parseFloat(formData.width_cm) : null,
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : null,
        depth_cm: formData.depth_cm ? parseFloat(formData.depth_cm) : null,
        images: productImages,
        imei: formData.imei || null,
        supplier: formData.supplier || null,
        product_note: formData.product_note || null,
        selected_stock: formData.selected_stock || null,
        vat_type: formData.vat_type,
        variants: [formData.variant]
      };

      await addProduct(productData);
      navigateToProduct('product-list');
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else if (name === 'vat_type') {
      setFormData(prev => {
        const newData = { ...prev, [name]: value };
        if (value === 'margin') {
          newData.retail_price_ttc = '';
          newData.pro_price_ttc = '';
        }
        return newData;
      });
      
      if (formData.retail_price) {
        calculateMargins('retail', 'price', formData.retail_price);
      }
      if (formData.pro_price) {
        calculateMargins('pro', 'price', formData.pro_price);
      }
    } else if (name === 'purchase_price' || name === 'purchase_price_2') {
      setFormData(prev => ({ ...prev, [name]: value }));
      
      if (formData.retail_price) {
        calculateMargins('retail', 'price', formData.retail_price);
      }
      if (formData.pro_price) {
        calculateMargins('pro', 'price', formData.pro_price);
      }
    } else if (name.startsWith('retail_')) {
      const field = name.replace('retail_', '') as 'price' | 'margin_percent' | 'margin_amount';
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          retail_price: '',
          retail_margin_percent: '',
          retail_margin_amount: '',
          retail_price_ttc: ''
        }));
      } else {
        calculateMargins('retail', field, value);
      }
    } else if (name.startsWith('pro_')) {
      const field = name.replace('pro_', '') as 'price' | 'margin_percent' | 'margin_amount';
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          pro_price: '',
          pro_margin_percent: '',
          pro_margin_amount: '',
          pro_price_ttc: ''
        }));
      } else {
        calculateMargins('pro', field, value);
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigateToProduct('add-product-pam')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={20} className="mr-2" />
          Retour
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold">Ajouter un produit avec numéro de série</h2>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Type de TVA</h3>
          <div className="flex gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="vat_type"
                value="normal"
                checked={formData.vat_type === 'normal'}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">TVA normale</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="vat_type"
                value="margin"
                checked={formData.vat_type === 'margin'}
                onChange={handleChange}
                className="form-radio h-4 w-4 text-blue-600"
              />
              <span className="ml-2">TVA sur marge</span>
            </label>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Catégorie du produit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nature du produit
              </label>
              <select
                name="category.type"
                value={formData.category.type}
                onChange={handleChange}
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
                name="category.brand"
                value={formData.category.brand}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={!formData.category.type}
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
                name="category.model"
                value={formData.category.model}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                disabled={!formData.category.brand}
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
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix d'achat brut
            </label>
            <input
              type="number"
              name="purchase_price"
              value={formData.purchase_price}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prix d'achat avec frais
            </label>
            <input
              type="number"
              name="purchase_price_2"
              value={formData.purchase_price_2}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              step="0.01"
              min={formData.purchase_price || 0}
              placeholder="Prix avec frais engagés"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix de vente magasin
          </label>
          <div className={`grid ${formData.vat_type === 'normal' ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix de vente HT</label>
              <input
                type="number"
                name="retail_price"
                value={formData.retail_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
                min={formData.purchase_price_2 || formData.purchase_price || 0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marge (%)</label>
              <input
                type="number"
                name="retail_margin_percent"
                value={formData.retail_margin_percent}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marge (€)</label>
              <input
                type="number"
                name="retail_margin_amount"
                value={formData.retail_margin_amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
              />
            </div>
            {formData.vat_type === 'normal' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prix TTC</label>
                <input
                  type="number"
                  value={formData.retail_price_ttc}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prix de vente pro
          </label>
          <div className={`grid ${formData.vat_type === 'normal' ? 'grid-cols-4' : 'grid-cols-3'} gap-4`}>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Prix de vente HT</label>
              <input
                type="number"
                name="pro_price"
                value={formData.pro_price}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
                min={formData.purchase_price_2 || formData.purchase_price || 0}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marge (%)</label>
              <input
                type="number"
                name="pro_margin_percent"
                value={formData.pro_margin_percent}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Marge (€)</label>
              <input
                type="number"
                name="pro_margin_amount"
                value={formData.pro_margin_amount}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                step="0.01"
              />
            </div>
            {formData.vat_type === 'normal' && (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Prix TTC</label>
                <input
                  type="number"
                  value={formData.pro_price_ttc}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                  readOnly
                />
              </div>
            )}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Variantes du produit</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Couleur
              </label>
              <select
                name="variant.color"
                value={formData.variant.color}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
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
                name="variant.grade"
                value={formData.variant.grade}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
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
                name="variant.capacity"
                value={formData.variant.capacity}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="">Sélectionner une capacité</option>
                {uniqueCapacities.map(capacity => (
                  <option key={capacity} value={capacity}>{capacity}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IMEI
            </label>
            <input
              type="text"
              name="imei"
              value={formData.imei}
              onChange={handleChange}
              maxLength={15}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fournisseur
            </label>
            <input
              type="text"
              name="supplier"
              value={formData.supplier}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localisation
            </label>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="EMPLACEMENT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Stock sélectionné
            </label>
            <select
              name="selected_stock"
              value={formData.selected_stock}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Sélectionner un stock</option>
              <option value="stock1">Stock Principal</option>
              <option value="stock2">Stock Secondaire</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
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
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dimensions du produit
          </label>
          <div className="grid grid-cols-3 gap-4">
            <div className="relative">
              <input
                type="number"
                name="width_cm"
                value={formData.width_cm}
                onChange={handleChange}
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
                placeholder="Largeur"
                step="0.1"
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
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
                placeholder="Hauteur"
                step="0.1"
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
                className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-md"
                placeholder="Profondeur"
                step="0.1"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Note produit
          </label>
          <textarea
            name="product_note"
            value={formData.product_note}
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
            Gestion des images ({productImages.length})
          </button>
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateToProduct('add-product-pam')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Enregistrer
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