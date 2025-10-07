import React from 'react';
import type { ProcessingOptions } from '../utils/imageProcessor';

interface ProcessingControlsProps {
	options: ProcessingOptions;
	onOptionsChange: (options: ProcessingOptions) => void;
	onProcess: () => void;
	onPreview: () => void;
	disabled: boolean;
	showingPreview: boolean;
	onRemoveColor: (index: number) => void;
}

export const ProcessingControls: React.FC<ProcessingControlsProps> = ({
	options,
	onOptionsChange,
	onProcess,
	onPreview,
	disabled,
	showingPreview,
	onRemoveColor,
}) => {
	return (
		<div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 shadow-xl">
			<h3 className="font-semibold text-xl text-gray-800 mb-6 flex items-center gap-2">
				<svg
					className="w-5 h-5 text-blue-600 flex-shrink-0"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
					/>
				</svg>
				Processing Options
			</h3>

			<div className="space-y-6">
				<div className="space-y-4">
					<label className="flex items-center space-x-3 cursor-pointer group px-4 py-3 rounded-xl hover:bg-blue-50 transition-all duration-200">
						<input
							type="checkbox"
							checked={options.removeCheckered}
							onChange={(e) => onOptionsChange({ ...options, removeCheckered: e.target.checked })}
							className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
						/>
						<span className="text-gray-700 group-hover:text-gray-900 transition-colors flex-1">
							Remove checkered pattern
						</span>
					</label>
				</div>

				<div className="pt-4 border-t border-gray-200">
					<label className="block text-sm font-medium text-gray-800 mb-4">
						Tolerance: <span className="text-blue-600 font-bold text-lg">{options.tolerance}</span>
					</label>
					<input
						type="range"
						min="5"
						max="50"
						value={options.tolerance}
						onChange={(e) => onOptionsChange({ ...options, tolerance: parseInt(e.target.value) })}
						className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 hover:accent-blue-700 transition-colors"
						style={{
							background: `linear-gradient(to right, rgb(37 99 235) 0%, rgb(37 99 235) ${((options.tolerance - 5) / 45) * 100}%, rgb(229 231 235) ${((options.tolerance - 5) / 45) * 100}%, rgb(229 231 235) 100%)`,
						}}
					/>
					<div className="flex justify-between text-xs text-gray-600 mt-2">
						<span>Strict</span>
						<span>Lenient</span>
					</div>
					<p className="text-xs text-gray-600 mt-3 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
						Higher tolerance removes more similar colors
					</p>
				</div>

				{/* Selected Colors */}
				{options.selectedColors && options.selectedColors.length > 0 && (
					<div className="pt-4 border-t border-gray-200">
						<label className="block text-sm font-medium text-gray-800 mb-3">Selected Colors to Remove</label>
						<div className="flex flex-wrap gap-2">
							{options.selectedColors.map((color, index) => (
								<div
									key={index}
									className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border-2 border-gray-300 bg-white hover:border-red-400 transition-all duration-200">
									<div
										className="w-6 h-6 rounded border border-gray-300"
										style={{ backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})` }}
									/>
									<span className="text-xs text-gray-600">
										({color.r}, {color.g}, {color.b})
									</span>
									<button
										onClick={() => onRemoveColor(index)}
										className="ml-1 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
										title="Remove this color">
										×
									</button>
								</div>
							))}
						</div>
						<p className="text-xs text-gray-600 mt-2 bg-purple-50 px-3 py-2 rounded-lg border border-purple-200">
							Click on the image to pick background colors
						</p>
					</div>
				)}

				<div className="space-y-3">
					<button
						onClick={onPreview}
						disabled={disabled}
						className="relative w-full group overflow-hidden bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600 py-3 px-6 rounded-xl transition-all duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
						<div className="flex items-center justify-center gap-2">
							{showingPreview ? (
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							) : (
								<svg
									className="w-5 h-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
									/>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
									/>
								</svg>
							)}
							<span>{showingPreview ? 'Hide Preview' : 'Preview Removal'}</span>
						</div>
					</button>

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
								<svg
									className="w-5 h-5 group-hover:translate-x-1 transition-transform"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M13 7l5 5m0 0l-5 5m5-5H6"
									/>
								</svg>
							)}
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};
