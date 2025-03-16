import React, { useState, useRef } from 'react';
import { Download, Upload, ArrowRight } from 'lucide-react';

interface CSVImportProps {
  onImport: (products: any[]) => Promise<void>;
}

export const CSVImport: React.FC<CSVImportProps> = ({ onImport }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSampleCSV = () => {
    const headers = ['Name', 'SKU', 'EAN', 'Purchase Price', 'Stock', 'Stock Alert', 'Description'];
    const sampleData = [
      'iPhone 14 Pro Max', 'IP14PM-128-BLK', '123456789012', '999.99', '10', '2', 'Black 128GB'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'product_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const validateCSVFormat = (headers: string[]): boolean => {
    const requiredColumns = ['Name', 'SKU', 'EAN', 'Purchase Price', 'Stock'];
    return requiredColumns.every(col => 
      headers.map(h => h.trim()).includes(col)
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setError('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    setError(null);
    setProgress({ current: 0, total: 0 });

    try {
      const text = await file.text();
      const lines = text.split('\n').map(line => line.trim()).filter(line => line);
      const headers = lines[0].split(',').map(h => h.trim());

      if (!validateCSVFormat(headers)) {
        setError('Invalid CSV format. Required columns: Name, SKU, EAN, Purchase Price, Stock');
        setIsImporting(false);
        return;
      }

      const products = [];
      const errors = [];
      setProgress({ current: 0, total: lines.length - 1 });

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const values = line.split(',').map(v => v.trim());

        try {
          if (values.length !== headers.length) {
            throw new Error('Invalid number of columns');
          }

          const product = headers.reduce((obj, header, index) => {
            let value = values[index];

            // Convert numeric fields
            if (['Purchase Price', 'Stock', 'Stock Alert'].includes(header)) {
              const num = parseFloat(value);
              if (isNaN(num)) {
                throw new Error(`Invalid ${header.toLowerCase()}`);
              }
              value = num;
            }

            // Validate required fields
            if (['Name', 'SKU', 'EAN', 'Purchase Price', 'Stock'].includes(header) && !value) {
              throw new Error(`Missing ${header.toLowerCase()}`);
            }

            obj[header.toLowerCase().replace(' ', '_')] = value;
            return obj;
          }, {} as any);

          products.push(product);
          setProgress(prev => ({ ...prev, current: i }));
        } catch (err) {
          errors.push(`Line ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      if (errors.length > 0) {
        setError(`Found ${errors.length} errors:\n${errors.join('\n')}`);
        setIsImporting(false);
        return;
      }

      await onImport(products);
      setIsImporting(false);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError('Error processing CSV file');
      setIsImporting(false);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Quick Tip! </span>
          <ArrowRight className="text-blue-500" size={20} />
          <span className="text-gray-600">Import a CSV if you have many products to add at once!</span>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={downloadSampleCSV}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            disabled={isImporting}
          >
            <Download size={18} />
            Download Sample CSV
          </button>

          <label className={`flex items-center gap-2 px-4 py-2 ${isImporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 cursor-pointer'} text-white rounded-md`}>
            <Upload size={18} />
            Import CSV
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".csv"
              className="hidden"
              disabled={isImporting}
            />
          </label>
        </div>
      </div>

      {isImporting && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Processing: {progress.current}/{progress.total} products
          </p>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
};