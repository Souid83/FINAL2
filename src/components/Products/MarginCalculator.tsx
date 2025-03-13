import React, { useState, useEffect } from 'react';

const TVA_RATE = 0.20; // 20% TVA

interface MarginCalculatorResult {
  commercialMargin: number;
  marginRate: number;
  priceTTC: number;
}

export const MarginCalculator: React.FC = () => {
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [sellingPrice, setSellingPrice] = useState<string>('');
  const [sellingPriceTTC, setSellingPriceTTC] = useState<string>('');
  const [result, setResult] = useState<MarginCalculatorResult | null>(null);
  const [error, setError] = useState<string>('');

  const calculateTTC = (priceHT: number): number => {
    return priceHT * (1 + TVA_RATE);
  };

  const calculateHT = (priceTTC: number): number => {
    return priceTTC / (1 + TVA_RATE);
  };

  useEffect(() => {
    if (sellingPrice) {
      const priceHT = parseFloat(sellingPrice);
      if (!isNaN(priceHT)) {
        setSellingPriceTTC(calculateTTC(priceHT).toFixed(2));
      }
    }
  }, [sellingPrice]);

  const handleTTCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const priceTTC = parseFloat(e.target.value);
    setSellingPriceTTC(e.target.value);
    if (!isNaN(priceTTC)) {
      setSellingPrice(calculateHT(priceTTC).toFixed(2));
    }
  };

  const calculateMargins = () => {
    const purchase = parseFloat(purchasePrice);
    const selling = parseFloat(sellingPrice);

    if (purchase <= 0 || selling <= 0) {
      setError("Le prix d'achat et le prix de vente doivent être supérieurs à zéro.");
      setResult(null);
      return;
    }

    if (isNaN(purchase) || isNaN(selling)) {
      setError("Veuillez entrer des valeurs numériques valides.");
      setResult(null);
      return;
    }

    const commercialMargin = selling - purchase;
    const marginRate = (commercialMargin / purchase) * 100;
    const priceTTC = calculateTTC(selling);

    setResult({
      commercialMargin,
      marginRate,
      priceTTC
    });
    setError('');
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Calculateur de marge</h2>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix d'achat HT (€)
          </label>
          <input
            type="number"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix de vente HT (€)
          </label>
          <input
            type="number"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            step="0.01"
            min="0"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prix de vente TTC (€)
          </label>
          <input
            type="number"
            value={sellingPriceTTC}
            onChange={handleTTCChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            step="0.01"
            min="0"
          />
        </div>
      </div>

      <button
        onClick={calculateMargins}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mb-4"
      >
        Calculer
      </button>

      {error && (
        <div className="text-red-600 mb-4">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Marge commerciale</h3>
              <p className="text-lg font-semibold text-gray-900">{result.commercialMargin.toFixed(2)} €</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Taux de marge</h3>
              <p className="text-lg font-semibold text-gray-900">{result.marginRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};