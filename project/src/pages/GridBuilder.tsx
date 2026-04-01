// import React, { useState } from 'react';
// import { AlertCircle, Save, Play, Pause } from 'lucide-react';
// import Card from '../components/common/Card';
// import Button from '../components/common/Button';
// import { usePanels } from '../context/PanelContext';
// import Spinner from '../components/common/Spinner';

// const GridBuilder: React.FC = () => {
//   const { createGrid, gridConfig, loadingPanels } = usePanels();
//   const [rows, setRows] = useState(gridConfig.rows || 10);
//   const [columns, setColumns] = useState(gridConfig.columns || 10);
//   const [isCreating, setIsCreating] = useState(false);
//   const [showWarning, setShowWarning] = useState(false);
//   const [isSimulating, setIsSimulating] = useState(false);
//   const totalPanels = rows * columns;
  
//   const handleCreateGrid = () => {
//     if (totalPanels > 100000) {
//       setShowWarning(true);
//       return;
//     }
    
//     setIsCreating(true);
    
//     // Create grid in chunks to prevent UI freezing
//     setTimeout(() => {
//       createGrid(rows, columns);
//       setIsCreating(false);
//       setShowWarning(false);
//     }, 100);
//   };

//   const toggleSimulation = () => {
//     setIsSimulating(!isSimulating);
//   };
  
//   if (loadingPanels) {
//     return (
//       <div className="flex items-center justify-center h-full">
//         <Spinner size="lg" text="Loading grid configuration..." />
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <h1 className="text-2xl font-bold text-gray-900">Panel Grid Builder</h1>
//         <Button
//           variant={isSimulating ? 'danger' : 'success'}
//           size="sm"
//           icon={isSimulating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
//           onClick={toggleSimulation}
//         >
//           {isSimulating ? 'Stop Simulation' : 'Start Simulation'}
//         </Button>
//       </div>
      
//       <Card>
//         <div className="space-y-6">
//           <p className="text-gray-600">
//             Create a custom panel grid layout with support for up to 100,000 panels. The system uses efficient data loading and virtualization for smooth performance.
//           </p>
          
//           {showWarning && (
//             <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start">
//               <AlertCircle className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0 mt-0.5" />
//               <div>
//                 <h3 className="font-medium text-yellow-800">Warning</h3>
//                 <p className="text-sm text-yellow-700">
//                   Creating a grid with more than 100,000 panels may impact browser performance.
//                   Consider reducing the size or splitting into multiple grids.
//                 </p>
//               </div>
//             </div>
//           )}
          
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             <div>
//               <label htmlFor="rows" className="block text-sm font-medium text-gray-700 mb-1">
//                 Number of Rows
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="number"
//                   id="rows"
//                   min="1"
//                   max="1000"
//                   value={rows}
//                   onChange={(e) => setRows(parseInt(e.target.value) || 1)}
//                   className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
//                   placeholder="Enter number of rows"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
//                   <span className="text-gray-500 sm:text-sm">rows</span>
//                 </div>
//               </div>
//               <p className="mt-1 text-sm text-gray-500">Maximum 1000 rows supported</p>
//             </div>
            
//             <div>
//               <label htmlFor="columns" className="block text-sm font-medium text-black-700 mb-1">
//                 Number of Columns
//               </label>
//               <div className="mt-1 relative rounded-md shadow-sm">
//                 <input
//                   type="number"
//                   id="columns"
//                   min="1"
//                   max="1000"
//                   value={columns}
//                   onChange={(e) => setColumns(parseInt(e.target.value) || 1)}
//                   className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
//                   placeholder="Enter number of columns"
//                 />
//                 <div className="absolute inset-y-0 right-0 flex items-center pr-3">
//                   <span className="text-gray-500 sm:text-sm">columns</span>
//                 </div>
//               </div>
//               <p className="mt-1 text-sm text-gray-500">Maximum 1000 columns supported</p>
//             </div>
//           </div>
          
//           <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
//             <h3 className="text-lg font-medium text-gray-800 mb-4">Grid Summary</h3>
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-medium text-gray-600">Rows</p>
//                   <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
//                     {rows}
//                   </span>
//                 </div>
//                 <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-blue-500 transition-all duration-300" 
//                     style={{ width: `${(rows / 1000) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
              
//               <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-medium text-gray-600">Columns</p>
//                   <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
//                     {columns}
//                   </span>
//                 </div>
//                 <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
//                   <div 
//                     className="h-full bg-purple-500 transition-all duration-300" 
//                     style={{ width: `${(columns / 1000) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
              
//               <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
//                 <div className="flex items-center justify-between">
//                   <p className="text-sm font-medium text-gray-600">Total Panels</p>
//                   <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                     totalPanels > 50000 
//                       ? 'bg-red-100 text-red-800'
//                       : totalPanels > 25000
//                         ? 'bg-yellow-100 text-yellow-800'
//                         : 'bg-green-100 text-green-800'
//                   }`}>
//                     {totalPanels.toLocaleString()}
//                   </span>
//                 </div>
//                 <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
//                   <div 
//                     className={`h-full transition-all duration-300 ${
//                       totalPanels > 50000 
//                         ? 'bg-red-500'
//                         : totalPanels > 25000
//                           ? 'bg-yellow-500'
//                           : 'bg-green-500'
//                     }`}
//                     style={{ width: `${(totalPanels / 100000) * 100}%` }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-4">
//             <Button
//               variant="outline"
//               size="lg"
//               onClick={() => {
//                 setRows(10);
//                 setColumns(10);
//               }}
//             >
//               Reset
//             </Button>
//             <Button
//               variant="primary"
//               size="lg"
//               icon={<Save className="h-5 w-5" />}
//               onClick={handleCreateGrid}
//               isLoading={isCreating}
//             >
//               Create Grid
//             </Button>
//           </div>
//         </div>
//       </Card>
      
//       <Card title="Performance Optimization Features">
//         <div className="space-y-4">
//           <div className="flex items-start space-x-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
//                 <span className="text-blue-600 font-semibold">1</span>
//               </div>
//             </div>
//             <div>
//               <h4 className="text-sm font-medium text-blue-900">Virtualized Grid Rendering</h4>
//               <p className="mt-1 text-sm text-blue-700">
//                 Only visible panels are rendered, drastically improving performance for large grids.
//               </p>
//             </div>
//           </div>

//           <div className="flex items-start space-x-3 p-4 bg-green-50 rounded-lg border border-green-100">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
//                 <span className="text-green-600 font-semibold">2</span>
//               </div>
//             </div>
//             <div>
//               <h4 className="text-sm font-medium text-green-900">Chunked Data Loading</h4>
//               <p className="mt-1 text-sm text-green-700">
//                 Data is loaded in smaller chunks as needed, ensuring smooth scrolling and navigation.
//               </p>
//             </div>
//           </div>

//           <div className="flex items-start space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
//             <div className="flex-shrink-0">
//               <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
//                 <span className="text-purple-600 font-semibold">3</span>
//               </div>
//             </div>
//             <div>
//               <h4 className="text-sm font-medium text-purple-900">Real-time Simulation</h4>
//               <p className="mt-1 text-sm text-purple-700">
//                 Optional real-time fault simulation to test system performance under dynamic conditions.
//               </p>
//             </div>
//           </div>
//         </div>
//       </Card>
//     </div>
//   );
// };

// export default GridBuilder;