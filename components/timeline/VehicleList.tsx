import React from 'react';
import { CarFront } from 'lucide-react';
import { VehicleDetails } from '../../types';

interface VehicleListProps {
  vehicles: string[];
  identified?: VehicleDetails[];
  t: any;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles, identified, t }) => (
  <div className="mt-8 pt-6 border-t border-slate-100">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
        <CarFront size={14} />
        {t.identifiedVehicles}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
       {identified ? (
           identified.map((vehicle, idx) => (
               <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex gap-3 items-start hover:border-slate-300 transition-colors">
                   <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
                      <CarFront size={20} className="text-slate-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-sm truncate">{vehicle.make} {vehicle.model}</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                          <span className="bg-white border border-slate-100 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600">
                             {vehicle.year}
                          </span>
                          {vehicle.color}
                      </div>
                      <div className="mt-2 text-xs font-mono bg-slate-200/50 text-slate-600 px-2 py-1 rounded w-fit border border-slate-200">
                         {vehicle.licensePlate !== 'Unknown' && vehicle.licensePlate !== 'Not Visible' ? (
                            <span className="font-bold text-slate-800">{vehicle.licensePlate}</span>
                         ) : (
                            <span className="italic opacity-75">{vehicle.licensePlate}</span>
                         )}
                      </div>
                   </div>
               </div>
           ))
       ) : (
           vehicles.map((vehicle, idx) => (
            <span 
                key={idx} 
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200"
            >
                {vehicle}
            </span>
           ))
       )}
    </div>
  </div>
);

export default VehicleList;