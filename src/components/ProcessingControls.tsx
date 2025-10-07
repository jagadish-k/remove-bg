import React from 'react';
import type { ProcessingOptions } from '../utils/imageProcessor';

interface ProcessingControlsProps {
	options: ProcessingOptions;
	onOptionsChange: (options: ProcessingOptions) => void;
	onProcess: () => void;
	disabled: boolean;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({
	options,
	onOptionsChange,
	onProcess,
	disabled,
}) => {
	return (
		<div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 shadow-2xl">
			<h3 className="font-semibold text-xl text-white mb-6 flex items-center gap-2">
				<svg className="w-5 h-5 text-blue-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
				</svg>
				Processing Options
			</h3>

			<div className="space-y-6">
				<div className="space-y-4">
					<label className="flex items-center space-x-3 cursor-pointer group px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200">
						<input
							type="checkbox"
							checked={options.removeCheckered}
							onChange={(e) => onOptionsChange({ ...options, removeCheckered: e.target.checked })}
							className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer"
						/>
						<span className="text-blue-100 group-hover:text-white transition-colors flex-1">Remove checkered pattern</span>
					</label>

					<label className="flex items-center space-x-3 cursor-pointer group px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200">
						<input
							type="checkbox"
							checked={options.removeSolid}
							onChange={(e) => onOptionsChange({ ...options, removeSolid: e.target.checked })}
							className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer"
						/>
						<span className="text-blue-100 group-hover:text-white transition-colors flex-1">Remove solid background</span>
					</label>

					<label className="flex items-center space-x-3 cursor-pointer group px-4 py-3 rounded-xl hover:bg-white/5 transition-all duration-200">
						<input
							type="checkbox"
							checked={options.removeShadow}
							onChange={(e) => onOptionsChange({ ...options, removeShadow: e.target.checked })}
							className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-2 focus:ring-blue-400 cursor-pointer"
						/>
						<span className="text-blue-100 group-hover:text-white transition-colors flex-1">Remove shadows</span>
					</label>
				</div>

				<div className="pt-4 border-t border-white/10">
					<label className="block text-sm font-medium text-white mb-4">
						Tolerance: <span className="text-blue-300 font-bold text-lg">{options.tolerance}</span>
					</label>
					<input
						type="range"
						min="5"
						max="50"
						value={options.tolerance}
						onChange={(e) => onOptionsChange({ ...options, tolerance: parseInt(e.target.value) })}
						className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-colors"
						style={{
							background: `linear-gradient(to right, rgb(59 130 246) 0%, rgb(59 130 246) ${((options.tolerance - 5) / 45) * 100}%, rgba(255,255,255,0.1) ${((options.tolerance - 5) / 45) * 100}%, rgba(255,255,255,0.1) 100%)`
						}}
					/>
					<div className="flex justify-between text-xs text-blue-200/70 mt-2">
						<span>Strict</span>
						<span>Lenient</span>
					</div>
					<p className="text-xs text-blue-200/60 mt-3 bg-blue-500/10 px-3 py-2 rounded-lg border border-blue-400/20">
						Higher tolerance removes more similar colors
					</p>
				</div>

				<button
					onClick={onProcess}
					disabled={disabled}
					aria-busy={disabled}
					className="relative w-full group overflow-hidden">
					{/* Animated glow background */}
					<div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-purple-600 rounded-xl opacity-100 group-hover:opacity-0 transition-opacity duration-300"></div>
					<div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
					<div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-xl blur-lg opacity-0 group-hover:opacity-75 transition-opacity duration-300 group-disabled:opacity-0"></div>

					{/* Button content */}
					<div className="relative flex items-center justify-center gap-3 py-4 px-6 text-white font-bold text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 group-hover:scale-[1.02] group-active:scale-[0.98]">
						{disabled && (
							<span className="inline-block animate-spin rounded-full h-5 w-5 border-3 border-white border-t-transparent"></span>
						)}
						<span>{disabled ? 'Processing…' : 'Process Image'}</span>
						{!disabled && (
							<svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
							</svg>
						)}
					</div>
				</button>
			</div>
		</div>
	);
};
