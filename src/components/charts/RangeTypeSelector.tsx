import { useState } from 'react';

export const RangeTypeSelector = ({ currentPrice, setMinPrice, setMaxPrice, baseAPR }) => {
    const [selected, setSelected] = useState(null);
    const rangeTypes = [
        { id: 'deep', label: 'Deep', range: '±50%', mult: [0.5, 1.5], aprMult: 0.2 },
        { id: 'passive', label: 'Passive', range: '±25%', mult: [0.75, 1.25], aprMult: 0.4 },
        { id: 'wide', label: 'Wide', range: '±10%', mult: [0.9, 1.1], aprMult: 1.0 },
        { id: 'narrow', label: 'Narrow', range: '±2.5%', mult: [0.975, 1.025], aprMult: 4.0 },
        { id: 'degen', label: 'Degen', range: '1 tick', mult: [0.999, 1.001], aprMult: 200 }
    ];
    
    const handleSelect = (type) => {
        setSelected(type.id);
        setMinPrice(currentPrice * type.mult[0]);
        setMaxPrice(currentPrice * type.mult[1]);
    };
    
    return (
        <div className="range-selector">
            <div className="range-selector__label">Range Type</div>
            <div className="range-selector__options">
                {rangeTypes.map(type => {
                    const estimatedAPR = baseAPR * type.aprMult;
                    const isSelected = selected === type.id;
                    return (
                        <button 
                            key={type.id} 
                            onClick={() => handleSelect(type)} 
                            className={`range-selector__btn ${isSelected ? 'range-selector__btn--active' : ''}`}
                        >
                            <div className="range-selector__btn-label">{type.label}</div>
                            <div className="range-selector__btn-range">{type.range}</div>
                            <div className="range-selector__btn-apr">
                                {estimatedAPR >= 1000 ? `${(estimatedAPR / 1000).toFixed(0)}K` : estimatedAPR.toFixed(0)}%
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
