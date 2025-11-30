import React from 'react';
import { CarFront, Calendar, Palette, Hash } from 'lucide-react';
import { VehicleDetails } from '../../types';

interface VehicleListProps {
  vehicles: string[];
  identified?: VehicleDetails[];
  t: any;
}

const VehicleList: React.FC<VehicleListProps> = ({ vehicles = [], identified, t }) => (
  <div className="mt-8 pt-6 border-t border-slate-100">
    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
        <CarFront size={14} />
        {t.identifiedVehicles}
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
       {identified && identified.length > 0 ? (
           identified.map((vehicle, idx) => (
               <div key={idx} className="bg-white border border-slate-200 rounded-xl p-4 flex gap-4 items-start shadow-sm hover:border-slate-300 hover:shadow-md transition-all">
                   <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shrink-0 shadow-inner">
                      <CarFront size={24} className="text-slate-400" />
                   </div>
                   <div className="min-w-0 flex-1">
                      <div className="font-bold text-slate-800 text-lg leading-tight mb-1">{vehicle.make} {vehicle.model}</div>
                      
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500 mb-3">
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                             <Calendar size={10} className="text-slate-400" />
                             <span className="font-mono text-slate-700">{vehicle.year}</span>
                          </div>
                          <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                             <Palette size={10} className="text-slate-400" />
                             <span className="text-slate-700">{vehicle.color}</span>
                          </div>
                      </div>

                      <div className="flex flex-col gap-1">
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t.licensePlate}</span>
                         <div className={`px-2 py-1 rounded w-fit border-2 ${vehicle.licensePlate !== 'Unknown' && vehicle.licensePlate !== 'Not Visible' ? 'bg-white border-slate-800 text-slate-900' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400'}`}>
                            {vehicle.licensePlate !== 'Unknown' && vehicle.licensePlate !== 'Not Visible' ? (
                                <span className="font-mono font-bold tracking-widest text-sm">{vehicle.licensePlate}</span>
                            ) : (
                                <span className="italic text-xs">{vehicle.licensePlate}</span>
                            )}
                         </div>
                      </div>
                   </div>
               </div>
           ))
       ) : (
           (vehicles || []).map((vehicle, idx) => (
            <span 
                key={idx} 
                className="inline-flex items-center px-4 py-3 rounded-xl text-sm font-semibold bg-slate-50 text-slate-700 border border-slate-200"
            >
                {vehicle}
            </span>
           ))
       )}
    </div>
  </div>
);

export default VehicleList;