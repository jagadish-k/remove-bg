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
				<div>
					<label className="block text-sm font-medium text-gray-800 mb-4">
						Color Matching Sensitivity
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
						<span>Match exact colors</span>
						<span>Match similar colors</span>
					</div>
					<p className="text-xs text-gray-600 mt-3 bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
						Higher values will remove colors similar to the selected/detected ones, including blur and anti-aliased edges
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

				<div className="space-y-3 pt-4 border-t border-gray-200">
					{/* Toggle for Show Removal Mask */}
					<label className="flex items-center justify-between cursor-pointer group p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all duration-200">
						<span className="text-gray-800 font-medium flex items-center gap-2">
							<svg
								className="w-5 h-5 text-blue-600"
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
							Show Removal Mask
						</span>
						<div className="relative">
							<input
								type="checkbox"
								checked={showingPreview}
								onChange={onPreview}
								disabled={disabled}
								className="sr-only peer"
							/>
							<div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
						</div>
					</label>

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
