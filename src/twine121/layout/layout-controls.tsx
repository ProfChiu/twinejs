import * as React from 'react';

export interface LayoutSliderProps {
	label: string;
	min: number;
	max: number;
	step?: number;
	value: number;
	unit?: string;
	/** If set, shown instead of "0<unit>" when value is 0--e.g. "Auto". */
	zeroLabel?: string;
	note?: string;
	onChange: (value: number) => void;
}

export const LayoutSlider: React.FC<LayoutSliderProps> = props => {
	const {label, min, max, step = 1, value, unit, zeroLabel, note, onChange} =
		props;
	const displayValue = value === 0 && zeroLabel ? zeroLabel : `${value}${unit ?? ''}`;

	return (
		<div className="layout-slider">
			<div className="layout-slider-header">
				<span className="layout-slider-label">{label}</span>
				<span className="layout-slider-value">{displayValue}</span>
			</div>
			<input
				aria-label={label}
				max={max}
				min={min}
				onChange={e => onChange(Number(e.target.value))}
				step={step}
				type="range"
				value={value}
			/>
			{note && <p className="layout-slider-note">{note}</p>}
		</div>
	);
};

export interface LayoutColorFieldProps {
	label: string;
	value: string;
	onChange: (value: string) => void;
}

export const LayoutColorField: React.FC<LayoutColorFieldProps> = props => {
	const {label, value, onChange} = props;

	return (
		<label className="layout-color-field">
			<span className="layout-color-field-label">{label}</span>
			<span className="layout-color-field-control">
				<input
					aria-label={label}
					onChange={e => onChange(e.target.value)}
					type="color"
					value={value}
				/>
				<span className="layout-color-field-hex">{value}</span>
			</span>
		</label>
	);
};
