<script lang="ts">
	import { Video, Copy, Check, Info, Smartphone, Eye, EyeOff, Plus, Calendar, MapPin, Clock } from 'lucide-svelte';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();
	const { memorial } = data;
	
	// Make scheduledServices reactive to updates
	let scheduledServices = $state(data.scheduledServices || []);
	
	// Debug logging for memorial data
	console.log('🏛️ Memorial data loaded:', JSON.stringify(memorial, null, 2));
	console.log('🎥 Livestream data:', JSON.stringify(memorial.livestream, null, 2));
	console.log('🔗 Playback URLs available:', {
		playbackUrl: memorial.livestream?.playbackUrl,
		alternativePlaybackUrl: memorial.livestream?.alternativePlaybackUrl,
		directPlaybackUrl: memorial.livestream?.directPlaybackUrl,
		hls: memorial.livestream?.playback?.hls
	});

	// Scheduled Services State
	let selectedService = $state<any>(null);
	let showCreateModal = $state(false);
	let newStreamTitle = $state('');
	let scheduleType = $state<'now' | 'scheduled'>('now');
	let scheduledDateTime = $state('');

	// Stream Control State
	let streamKeyCopied = $state(false);
	let serverUrlCopied = $state(false);
	let whipUrl = $state('');
	let localStream = $state<MediaStream | null>(null);
	let pc = $state<RTCPeerConnection | null>(null);
	let isStreaming = $state(false);
	let isLoading = $state(false);
	let videoElement = $state<HTMLVideoElement | null>(null);
	let videoDevices = $state<MediaDeviceInfo[]>([]);
	let selectedVideoDeviceId = $state('');

	// Sync scheduledServices with data updates
	$effect(() => {
		if (data.scheduledServices) {
			scheduledServices = data.scheduledServices;
		}
	});

	// Debug logging for scheduled services
	$effect(() => {
		console.log('📅 Scheduled services loaded:', JSON.stringify(scheduledServices, null, 2));
	});

	$effect(() => {
		if (videoElement && localStream) {
			console.log('EFFECT: Attaching MediaStream to video element.');
			videoElement.srcObject = localStream;
			videoElement.play().catch(e => console.error('Error trying to play video:', e));
		} else {
			console.log('EFFECT: videoElement or localStream not ready.', { videoElement, localStream });
		}
	});

	// Service Selection Functions
	function selectService(service: any) {
		selectedService = service;
		console.log('🎯 Selected service:', service.title);
	}

	function formatDateTime(time: any) {
		if (!time?.date || time.isUnknown) return 'Time TBD';
		const date = new Date(time.date);
		const timeStr = time.time ? ` at ${time.time}` : '';
		return date.toLocaleDateString() + timeStr;
	}

	function getStatusColor(status: string | undefined) {
		switch (status) {
			case 'live': return 'bg-red-500';
			case 'scheduled': return 'bg-blue-500';
			case 'completed': return 'bg-green-500';
			default: return 'bg-gray-500';
		}
	}

	async function toggleServiceVisibility(event: Event, service: any) {
		event.stopPropagation(); // Prevent service selection when clicking visibility toggle
		
		const newVisibility = service.isVisible === false ? true : false;
		console.log(`🔄 Toggling visibility for ${service.title}: ${service.isVisible} → ${newVisibility}`);
		
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/scheduled-services/${service.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					isVisible: newVisibility 
				})
			});

			if (response.ok) {
				// Update local state
				scheduledServices = scheduledServices.map(s => 
					s.id === service.id 
						? { ...s, isVisible: newVisibility }
						: s
				);
				console.log(`✅ Updated visibility for ${service.title}`);
			} else {
				console.error('❌ Failed to update service visibility:', response.status);
			}
		} catch (error) {
			console.error('❌ Error updating service visibility:', error);
		}
	}

	async function createNewStream(event: SubmitEvent) {
		event.preventDefault();
		if (!newStreamTitle.trim()) return;
		
		isLoading = true;
		try {
			const response = await fetch(`/api/memorials/${memorial.id}/scheduled-services`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: newStreamTitle,
					scheduleType,
					scheduledTime: scheduleType === 'scheduled' ? scheduledDateTime : null
				})
			});

			if (response.ok) {
				const result = await response.json();
				
				// Add the new service to the reactive array instead of page reload
				if (result.service) {
					scheduledServices = [...scheduledServices, result.service];
					console.log('✅ New service added:', result.service.title);
				}
				
				// Reset form
				showCreateModal = false;
				newStreamTitle = '';
				scheduledDateTime = '';
				scheduleType = 'now';
			} else {
				const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
				console.error('Failed to create new stream:', errorData);
				// TODO: Show user-friendly error message
			}
		} catch (error) {
			console.error('Error creating new stream:', error);
			// TODO: Show user-friendly error message
		} finally {
			isLoading = false;
		}
	}

	async function copyToClipboard(text: string, type: 'key' | 'url') {
		try {
			await navigator.clipboard.writeText(text);
			
			if (type === 'key') {
				streamKeyCopied = true;
				setTimeout(() => (streamKeyCopied = false), 2000);
			} else {
				serverUrlCopied = true;
				setTimeout(() => (serverUrlCopied = false), 2000);
			}
		} catch (error) {
			console.error('Failed to copy to clipboard:', error);
			// Fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = text;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand('copy');
				if (type === 'key') {
					streamKeyCopied = true;
					setTimeout(() => (streamKeyCopied = false), 2000);
				} else {
					serverUrlCopied = true;
					setTimeout(() => (serverUrlCopied = false), 2000);
				}
			} catch (fallbackError) {
				console.error('Fallback copy failed:', fallbackError);
			}
			document.body.removeChild(textArea);
		}
	}

	// Dynamic stream credentials based on selected service
	const streamCredentials = $derived(() => {
		if (!selectedService) {
			return {
				streamKey: '',
				serverUrl: '',
				rtmpsUrl: ''
			};
		}
		
		const streamKey = selectedService.streamKey || '';
		const serverUrl = 'rtmps://live.cloudflare.com:443/live/';
		const rtmpsUrl = serverUrl + streamKey;
		
		return { streamKey, serverUrl, rtmpsUrl };
	});
	
	// Debug RTMPS configuration
	$effect(() => {
		console.log('📡 RTMPS Configuration:', {
			selectedService: selectedService?.title || 'None',
			streamKey: streamCredentials.streamKey ? 'SET' : 'MISSING',
			serverUrl: streamCredentials.serverUrl,
			rtmpsUrl: streamCredentials.rtmpsUrl
		});
	});

	async function getVideoDevices() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			videoDevices = devices.filter(d => d.kind === 'videoinput');
			if (videoDevices.length > 0 && !selectedVideoDeviceId) {
				selectedVideoDeviceId = videoDevices[0].deviceId;
			}
		} catch (error) {
			console.error('Error enumerating video devices:', error);
		}
	}

	async function getWhipUrlAndStartCamera(deviceId: string) {
		if (isLoading || !selectedService) {
			console.warn('Cannot start camera: loading in progress or no service selected');
			return;
		}
		
		isLoading = true;

		try {
			// Stop any existing stream before starting a new one
			await stopStreaming(false); // Keep UI state, just stop tracks

			// Get camera permissions and stream
			console.log(`📹 Requesting camera for service: ${selectedService.title}, deviceId: ${deviceId}`);
			const constraints: MediaStreamConstraints = {
				audio: true,
				video: deviceId ? { deviceId: { exact: deviceId } } : true
			};
			
			localStream = await navigator.mediaDevices.getUserMedia(constraints);
			console.log('✅ MediaStream acquired for service:', selectedService.title);

			// Populate device list if not already done
			if (videoDevices.length === 0) {
				await getVideoDevices();
			}

			// Fetch the WHIP URL from our API with service context
			console.log('🌐 Fetching WHIP URL from API for service:', selectedService.id);
			const response = await fetch(`/api/memorials/${memorial.id}/livestream/whip`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ 
					serviceId: selectedService.id,
					serviceTitle: selectedService.title 
				})
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error('❌ WHIP API Error:', errorText);
				throw new Error(`Failed to get WHIP URL: ${response.status}`);
			}

			const whipData = await response.json();
			console.log('🌐 WHIP API Response:', whipData);
			whipUrl = whipData.whipEndpoint || whipData.whipUrl;
			
			if (!whipUrl) {
				throw new Error('No WHIP endpoint received from server');
			}

		} catch (error) {
			console.error('Error preparing mobile stream:', error);
			// TODO: Replace alert with proper toast notification
			alert(`Could not start camera for ${selectedService?.title || 'service'}. Please check permissions and try again.`);
			await stopStreaming(); // Clean up
		} finally {
			isLoading = false;
		}
	}

	async function startBroadcast() {
		if (!whipUrl || !localStream) return;
		isLoading = true;

		pc = new RTCPeerConnection();
		pc.oniceconnectionstatechange = async () => {
			console.log('🧊 ICE Connection State changed:', pc?.iceConnectionState);
			if (pc?.iceConnectionState === 'connected') {
				console.log('✅ WebRTC connection established for service:', selectedService?.title);
				isStreaming = true;
				isLoading = false;
				
				// Update service status to live
				if (selectedService) {
					try {
						await fetch(`/api/memorials/${memorial.id}/scheduled-services/${selectedService.id}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({ status: 'live' })
						});
						
						// Update local state
						scheduledServices = scheduledServices.map(service => 
							service.id === selectedService.id 
								? { ...service, status: 'live' }
								: service
						);
					} catch (error) {
						console.error('Failed to update service status to live:', error);
					}
				}
			}
			if (pc?.iceConnectionState === 'failed' || pc?.iceConnectionState === 'disconnected') {
				console.log('❌ WebRTC connection failed/disconnected');
				await stopStreaming();
			}
		};
		
		pc.onconnectionstatechange = () => {
			console.log('🔗 Connection State changed:', pc?.connectionState);
		};
		
		pc.onicegatheringstatechange = () => {
			console.log('🧊 ICE Gathering State changed:', pc?.iceGatheringState);
		};

		console.log('📡 Adding tracks to peer connection...');
		localStream.getTracks().forEach(track => {
			console.log('➕ Adding track:', track.kind, track.label);
			pc!.addTrack(track, localStream!);
		});

		console.log('📝 Creating WebRTC offer...');
		const offer = await pc.createOffer();
		console.log('📝 Offer created:', offer.type, offer.sdp?.substring(0, 100) + '...');
		await pc.setLocalDescription(offer);
		console.log('📝 Local description set');

		try {
			console.log('🌐 Sending WHIP request to:', whipUrl);
			console.log('📝 SDP Offer length:', pc.localDescription?.sdp?.length);
			const response = await fetch(whipUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/sdp' },
				body: pc.localDescription?.sdp,
			});

			console.log('🌐 WHIP Response status:', response.status);
			console.log('🌐 WHIP Response headers:', Object.fromEntries(response.headers.entries()));
			
			if (!response.ok || response.status !== 201) {
				const errorBody = await response.text();
				console.error('❌ WHIP Error body:', errorBody);
				throw new Error(`WHIP connection failed: ${response.status} - ${errorBody}`);
			}

			const answerSdp = await response.text();
			console.log('📝 SDP Answer received, length:', answerSdp.length);
			console.log('📝 SDP Answer preview:', answerSdp.substring(0, 200) + '...');
			await pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
			console.log('📝 Remote description set successfully');

		} catch (error) {
			console.error('💥 Error during WHIP negotiation:', error);
			console.error('💥 Error details:', {
				message: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
				whipUrl,
				peerConnectionState: pc?.connectionState,
				iceConnectionState: pc?.iceConnectionState
			});
			alert('Failed to connect to the streaming server. Check console for details.');
			stopStreaming();
			isLoading = false;
		}
	}

	async function stopStreaming(resetUi: boolean = true) {
		console.log('🛑 Stopping stream for service:', selectedService?.title || 'unknown');
		
		try {
			// Close peer connection
			if (pc) {
				pc.close();
				pc = null;
			}
			
			// Stop all media tracks
			if (localStream) {
				localStream.getTracks().forEach(track => {
					console.log(`🛑 Stopping ${track.kind} track:`, track.label);
					track.stop();
				});
				localStream = null;
			}
			
			// Reset video element
			if (videoElement) {
				videoElement.srcObject = null;
			}
			
			// Stop the main livestream and create archive entry
			if (isStreaming) {
				try {
					await fetch(`/api/memorials/${memorial.id}/livestream`, {
						method: 'DELETE'
					});
					console.log('✅ Livestream stopped and archived');
				} catch (error) {
					console.error('Failed to stop livestream:', error);
				}
			}
			
			// Update service status if we were streaming
			if (isStreaming && selectedService) {
				try {
					await fetch(`/api/memorials/${memorial.id}/scheduled-services/${selectedService.id}`, {
						method: 'PUT',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ status: 'completed' })
					});
					
					// Update local state
					scheduledServices = scheduledServices.map(service => 
						service.id === selectedService.id 
							? { ...service, status: 'completed' }
							: service
					);
				} catch (error) {
					console.error('Failed to update service status:', error);
				}
			}
			
			if (resetUi) {
				whipUrl = '';
				isStreaming = false;
				isLoading = false;
			}
		} catch (error) {
			console.error('Error during stream cleanup:', error);
		}
	}
</script>

<svelte:head>
	<title>Start Stream - {memorial.lovedOneName}</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
	<div class="max-w-7xl mx-auto">
		<!-- Header -->
		<div class="mb-12">
			<div class="flex justify-between items-center mb-4">
				<a href="/profile" class="text-blue-400 hover:text-blue-300 transition-colors">&larr; Back to Profile</a>
				<a href={`/${memorial.fullSlug}`} target="_blank" class="px-4 py-2 rounded-xl bg-green-600 text-white font-medium hover:shadow-lg transition-all duration-300 hover:scale-105 flex items-center">
					<Eye class="w-4 h-4 mr-2" />
					View Memorial
				</a>
			</div>
			<h1 class="text-4xl font-bold mt-2">Livestream Control Center</h1>
			<p class="text-lg text-gray-400">{memorial.lovedOneName}</p>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
			<!-- Left Column: Scheduled Services -->
			<div class="lg:col-span-2 bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/10">
				<div class="flex justify-between items-center mb-6">
					<h2 class="text-2xl font-bold flex items-center">
						<Calendar class="w-6 h-6 mr-3 text-blue-400" />
						Scheduled Services
					</h2>
					<button
						onclick={() => showCreateModal = true}
						class="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors flex items-center"
					>
						<Plus class="w-4 h-4 mr-2" />
						Create New Stream
					</button>
				</div>

				{#if scheduledServices && scheduledServices.length > 0}
					<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
						{#each scheduledServices as service}
							<div 
								class="service-card p-4 rounded-xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 {selectedService?.id === service.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/20 bg-white/5 hover:border-white/40'}"
								onclick={() => selectService(service)}
								onkeydown={(e) => e.key === 'Enter' && selectService(service)}
								role="button"
								tabindex="0"
							>
								<div class="flex justify-between items-start mb-3">
									<h3 class="text-lg font-semibold text-white">{service.title}</h3>
									<span class="px-2 py-1 rounded-full text-xs font-medium text-white {getStatusColor(service.status)}">
										{service.status?.toUpperCase() || 'UNKNOWN'}
									</span>
								</div>
								
								<div class="space-y-2 text-sm text-gray-300">
									<div class="flex items-center">
										<Clock class="w-4 h-4 mr-2 text-blue-400" />
										{formatDateTime(service.time)}
									</div>
									<div class="flex items-center">
										<MapPin class="w-4 h-4 mr-2 text-green-400" />
										{service.location?.name || 'Location TBD'}
									</div>
									<div class="flex items-center">
										<Video class="w-4 h-4 mr-2 text-purple-400" />
										{service.hours} hours
									</div>
								</div>

								<!-- Visibility Toggle -->
								<div class="mt-4 pt-3 border-t border-white/10">
									<div class="flex items-center justify-between">
										<span class="text-sm text-gray-400">Memorial Page Visibility</span>
										<button
											onclick={(e) => toggleServiceVisibility(e, service)}
											class="flex items-center space-x-2 px-3 py-1 rounded-lg transition-colors {service.isVisible !== false ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30' : 'bg-gray-600/20 text-gray-400 hover:bg-gray-600/30'}"
										>
											{#if service.isVisible !== false}
												<Eye class="w-4 h-4" />
												<span class="text-xs font-medium">Visible</span>
											{:else}
												<EyeOff class="w-4 h-4" />
												<span class="text-xs font-medium">Hidden</span>
											{/if}
										</button>
									</div>
								</div>

								{#if service.status === 'live'}
									<div class="mt-3 flex items-center justify-center py-2 bg-red-500/20 rounded-lg">
										<div class="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
										<span class="text-red-400 font-medium">LIVE NOW</span>
									</div>
								{:else if selectedService?.id === service.id}
									<div class="mt-3 flex items-center justify-center py-2 bg-blue-500/20 rounded-lg">
										<Check class="w-4 h-4 text-blue-400 mr-2" />
										<span class="text-blue-400 font-medium">Selected</span>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{:else}
					<div class="text-center py-12">
						<Calendar class="w-16 h-16 mx-auto text-gray-600 mb-4" />
						<h3 class="text-xl font-semibold text-gray-400 mb-2">No Scheduled Services</h3>
						<p class="text-gray-500 mb-4">Create your first livestream to get started.</p>
						<button
							onclick={() => showCreateModal = true}
							class="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-medium transition-colors"
						>
							Create New Stream
						</button>
					</div>
				{/if}
			</div>

			<!-- Right Column: Stream Credentials -->
			<div class="bg-gray-800/50 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/10">
				{#if selectedService}
					<h2 class="text-2xl font-bold mb-2 flex items-center">
						<Info class="w-6 h-6 mr-3 text-blue-400" />
						Stream Setup
					</h2>
					<p class="text-gray-400 mb-6">{selectedService.title}</p>

					<div class="space-y-6">
						<!-- Server URL -->
						<div>
							<label for="server-url" class="block text-sm font-medium text-gray-400 mb-2">Server URL</label>
							<div class="flex items-center bg-gray-900 rounded-lg">
								<input id="server-url" type="text" readonly value={streamCredentials.serverUrl} class="w-full bg-transparent p-3 focus:outline-none" />
								<button
									onclick={() => copyToClipboard(streamCredentials.serverUrl, 'url')}
									class="p-3 text-gray-400 hover:text-white transition-colors"
								>
									{#if serverUrlCopied}
										<Check class="w-5 h-5 text-green-400" />
									{:else}
										<Copy class="w-5 h-5" />
									{/if}
								</button>
							</div>
						</div>

						<!-- Stream Key -->
						<div>
							<label for="stream-key" class="block text-sm font-medium text-gray-400 mb-2">Stream Key</label>
							<div class="flex items-center bg-gray-900 rounded-lg">
								<input id="stream-key" type="password" readonly value={streamCredentials.streamKey} class="w-full bg-transparent p-3 focus:outline-none" />
								<button
									onclick={() => copyToClipboard(streamCredentials.streamKey, 'key')}
									class="p-3 text-gray-400 hover:text-white transition-colors"
								>
									{#if streamKeyCopied}
										<Check class="w-5 h-5 text-green-400" />
									{:else}
										<Copy class="w-5 h-5" />
									{/if}
								</button>
							</div>
						</div>
					</div>
				{:else}
					<div class="text-center py-12">
						<Info class="w-16 h-16 mx-auto text-gray-600 mb-4" />
						<h3 class="text-xl font-semibold text-gray-400 mb-2">Select a Service</h3>
						<p class="text-gray-500">Choose a scheduled service from the left panel to configure streaming.</p>
					</div>
				{/if}

				{#if selectedService}
					<div class="mt-8 p-4 bg-blue-900/50 rounded-lg border border-blue-500/30">
						<p class="text-sm text-blue-300">
							Copy these credentials into your streaming software (e.g., OBS, Streamlabs) to start the broadcast for <strong>{selectedService.title}</strong>.
						</p>
					</div>

					<div class="my-8 border-t border-white/10"></div>

					<div>
						<h3 class="text-xl font-bold mb-4 flex items-center">
							<Smartphone class="w-5 h-5 mr-3 text-green-400" />
							Go Live from this Device
						</h3>

						{#if !whipUrl}
							<p class="text-gray-400 mb-4 text-sm">
								No extra software needed. Stream directly from your browser for {selectedService.title}.
							</p>
							<button
								onclick={() => getWhipUrlAndStartCamera(selectedVideoDeviceId)}
								disabled={isLoading}
								class="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
							>
								{#if isLoading}
									<span class="animate-pulse">Starting Camera...</span>
								{:else}
									<Video class="w-5 h-5 mr-2" />
									Enable Camera & Go Live
								{/if}
							</button>
					{:else}
						<div class="space-y-4">
							<div class="bg-black rounded-lg overflow-hidden aspect-video border border-white/10 relative group">
								<video 
									bind:this={videoElement} 
									class="w-full h-full" 
									autoplay 
									muted 
									playsinline
									onplaying={() => console.log('EVENT: Video element is now playing.')}
								></video>
								<div class="absolute top-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<select bind:value={selectedVideoDeviceId} onchange={() => getWhipUrlAndStartCamera(selectedVideoDeviceId)} class="w-full bg-black/50 text-white border border-white/20 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
										{#each videoDevices as device}
											<option value={device.deviceId}>{device.label}</option>
										{/each}
									</select>
								</div>
							</div>
							<div class="grid grid-cols-2 gap-4">
								{#if !isStreaming}
									<button
										onclick={startBroadcast}
										disabled={isLoading}
										class="w-full bg-red-600 hover:bg-red-500 disabled:bg-red-800 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
									>
										{#if isLoading}
											<span class="animate-pulse">Connecting...</span>
										{:else}
											<span class="w-3 h-3 mr-2 bg-white rounded-full"></span>
											START BROADCAST
										{/if}
									</button>
								{:else}
									<div class="w-full bg-red-800/50 text-red-300 font-bold py-3 px-4 rounded-lg flex items-center justify-center">
										<span class="w-3 h-3 mr-2 bg-red-500 rounded-full animate-pulse"></span>
										LIVE
									</div>
								{/if}
								<button
									onclick={() => stopStreaming(true)}
									class="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
								>
									Stop
								</button>
							</div>
						</div>
					{/if}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Create New Stream Modal -->
{#if showCreateModal}
	<div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
		<div class="bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 border border-white/10">
			<h2 class="text-2xl font-bold mb-6 text-white">Create New Livestream</h2>
			
			<form onsubmit={createNewStream} class="space-y-6">
				<div>
					<label for="stream-title" class="block text-sm font-medium text-gray-400 mb-2">Stream Title</label>
					<input 
						id="stream-title"
						type="text" 
						bind:value={newStreamTitle}
						placeholder="Enter stream title..."
						class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
						required
					/>
				</div>

				<div>
					<label for="schedule-type" class="block text-sm font-medium text-gray-400 mb-2">Schedule Type</label>
					<select 
						id="schedule-type"
						bind:value={scheduleType}
						class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
					>
						<option value="now">Go Live Now</option>
						<option value="scheduled">Schedule for Later</option>
					</select>
				</div>

				{#if scheduleType === 'scheduled'}
					<div>
						<label for="scheduled-time" class="block text-sm font-medium text-gray-400 mb-2">Scheduled Date & Time</label>
						<input 
							id="scheduled-time"
							type="datetime-local" 
							bind:value={scheduledDateTime}
							class="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
							required
						/>
					</div>
				{/if}

				<div class="flex space-x-4 pt-4">
					<button 
						type="button" 
						onclick={() => showCreateModal = false}
						class="flex-1 px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white rounded-lg font-medium transition-colors"
					>
						Cancel
					</button>
					<button 
						type="submit"
						disabled={isLoading || !newStreamTitle.trim()}
						class="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
					>
						{#if isLoading}
							Creating...
						{:else}
							Create Stream
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
