export interface LivestreamOptions {
	basePackage: 'standard' | 'premium';
	duration: number;
	platform: 'youtube' | 'facebook' | 'custom';
	addObs: boolean;
	addExtraCameras: number;
	addExtraMicrophones: number;
}