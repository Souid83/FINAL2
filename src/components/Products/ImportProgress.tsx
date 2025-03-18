import React from 'react';
import { X, AlertCircle, Download } from 'lucide-react';

interface ImportError {
  row: number;
  sku: string;
  message: string;
}

interface ImportProgressProps {
  isOpen: boolean;
  onClose: () => void;
  current: number;
  total: number;
  errors: ImportError[];
  onExportErrors?: () => void;
}

export const ImportProgress: React.FC<ImportProgressProps> = ({
  isOpen,
  onClose,
  current,
  total,
  errors,
  onExportErrors
}) => {
  if (!isOpen) return null;

  const progress = total > 0 ? Math.round((current / total) * 100) : 0;
  const isComplete = current === total && total > 0;
  const hasErrors = errors.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isComplete ? 'Import terminé' : 'Import en cours...'}
          </h3>
          {isComplete && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{current} sur {total} produits</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Errors section */}
          {hasErrors && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-red-600 flex items-center">
                  <AlertCircle size={16} className="mr-1" />
                  Erreurs ({errors.length})
                </h4>
                {onExportErrors && (
                  <button
                    onClick={onExportErrors}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    <Download size={14} className="mr-1" />
                    Exporter les erreurs
                  </button>
                )}
              </div>
              <div className="bg-red-50 rounded-lg p-3 space-y-2">
                {errors.slice(0, 3).map((error, index) => (
                  <div key={index} className="text-sm text-red-700">
                    <span className="font-medium">Ligne {error.row}</span> - SKU: {error.sku}
                    <br />
                    {error.message}
                  </div>
                ))}
                {errors.length > 3 && (
                  <div className="text-sm text-red-600 font-medium">
                    + {errors.length - 3} autres erreurs
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className={`mt-4 p-4 rounded-lg ${hasErrors ? 'bg-yellow-50 text-yellow-800' : 'bg-green-50 text-green-800'}`}>
              <p className="font-medium">
                {hasErrors
                  ? `Import terminé avec ${errors.length} erreur${errors.length > 1 ? 's' : ''}`
                  : 'Import terminé avec succès !'}
              </p>
              <p className="text-sm mt-1">
                {hasErrors
                  ? 'Certains produits n\'ont pas pu être importés. Consultez la liste des erreurs pour plus de détails.'
                  : `${total} produit${total > 1 ? 's' : ''} importé${total > 1 ? 's' : ''} avec succès.`}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {isComplete && (
            <div className="flex justify-end mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                OK, j'ai compris
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};