import React, { useState } from 'react';
import { Sun, AlertCircle, Building, Ruler, Calendar } from 'lucide-react';
import Button from './common/Button';

export interface PanelData {
  company: string;
  model: string;
  dimensions: {
    width: number;
    height: number;
  };
  maxOutput: number;
  weight: number;
  efficiency: number;
  installationDate: string;
}

interface PanelRegistrationFormProps {
  onSubmit: (data: PanelData) => void;
  isLoading?: boolean;
  initialData?: PanelData;
  mode?: 'edit' | 'create';
}

const PanelRegistrationForm: React.FC<PanelRegistrationFormProps> = ({ 
  onSubmit, 
  isLoading = false,
  initialData,
  mode = 'create'
}) => {
  const [formData, setFormData] = useState<PanelData>(initialData || {
    company: '',
    model: '',
    dimensions: {
      width: 0,
      height: 0,
    },
    maxOutput: 0,
    weight: 0,
    efficiency: 0,
    installationDate: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof PanelData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof PanelData, string>> = {};
    let isValid = true;

    if (!formData.company.trim()) {
      newErrors.company = 'Company name is required';
      isValid = false;
    }

    if (!formData.model.trim()) {
      newErrors.model = 'Model is required';
      isValid = false;
    }

    if (formData.dimensions.width <= 0) {
      newErrors.dimensions = 'Width must be greater than 0';
      isValid = false;
    }

    if (formData.dimensions.height <= 0) {
      newErrors.dimensions = 'Height must be greater than 0';
      isValid = false;
    }

    if (!formData.installationDate) {
      newErrors.installationDate = 'Installation date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('dimensions.')) {
      const dimension = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimension]: parseFloat(value) || 0,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-8 backdrop-blur-sm bg-gray-900 bg-opacity-80 rounded-xl shadow-2xl border border-gray-700 transform transition-all duration-500 animate-fadeIn">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full animate-pulse-slow">
            <Sun className="h-12 w-12 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2 animate-slideInDown">Panel Details</h1>
        <p className="text-gray-300 animate-fadeIn">Configure your solar panel specifications</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="animate-slideInRight">
          <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
            Company Name
          </label>
          <div className="relative">
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 pl-10 bg-gray-800 border ${
                errors.company ? 'border-red-500' : 'border-gray-700'
              } rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300`}
              placeholder="Enter company name"
            />
            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.company && (
            <p className="mt-1 text-sm text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.company}
            </p>
          )}
        </div>

        <div className="animate-slideInRight">
          <label htmlFor="model" className="block text-sm font-medium text-gray-300 mb-2">
            Model
          </label>
          <div className="relative">
            <input
              type="text"
              id="model"
              name="model"
              value={formData.model}
              onChange={handleInputChange}
              className={`w-full px-3 py-3 pl-10 bg-gray-800 border ${
                errors.model ? 'border-red-500' : 'border-gray-700'
              } rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300`}
              placeholder="Enter model"
            />
            <Sun className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          {errors.model && (
            <p className="mt-1 text-sm text-red-400 flex items-center">
              <AlertCircle className="h-4 w-4 mr-1" />
              {errors.model}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-slideInLeft">
            <label htmlFor="dimensions.width" className="block text-sm font-medium text-gray-300 mb-2">
              Width (meters)
            </label>
            <div className="relative">
              <input
                type="number"
                id="dimensions.width"
                name="dimensions.width"
                value={formData.dimensions.width === 0 ? '' : formData.dimensions.width}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 pl-10 bg-gray-800 border ${
                  errors.dimensions ? 'border-red-500' : 'border-gray-700'
                } rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300`}
                placeholder="Enter width"
                step="0.01"
                min="0"
              />
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="animate-slideInRight">
            <label htmlFor="dimensions.height" className="block text-sm font-medium text-gray-300 mb-2">
              Height (meters)
            </label>
            <div className="relative">
              <input
                type="number"
                id="dimensions.height"
                name="dimensions.height"
                value={formData.dimensions.height === 0 ? '' : formData.dimensions.height}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 pl-10 bg-gray-800 border ${
                  errors.dimensions ? 'border-red-500' : 'border-gray-700'
                } rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300`}
                placeholder="Enter height"
                step="0.01"
                min="0"
              />
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {errors.dimensions && (
          <p className="text-sm text-red-400 flex items-center">
            <AlertCircle className="h-4 w-4 mr-1" />
            {errors.dimensions}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="animate-slideInRight">
            <label htmlFor="installationDate" className="block text-sm font-medium text-gray-300 mb-2">
              Installation Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="installationDate"
                name="installationDate"
                value={formData.installationDate}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 pl-10 bg-gray-800 border ${
                  errors.installationDate ? 'border-red-500' : 'border-gray-700'
                } rounded-md focus:outline-none focus:ring-amber-500 focus:border-amber-500 text-white transition-all duration-300`}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.installationDate && (
              <p className="mt-1 text-sm text-red-400 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {errors.installationDate}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <Button
            type="button"
            variant="secondary"
            onClick={() => window.history.back()}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors duration-300"
          >
            Back
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="px-6 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-md transition-all duration-300 ml-auto"
            isLoading={isLoading}
            icon={<Sun className="h-4 w-4 mr-2" />}
          >
            {mode === 'edit' ? 'Save Changes' : 'Complete Registration'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PanelRegistrationForm; 