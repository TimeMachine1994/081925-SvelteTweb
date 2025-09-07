<script lang="ts">
    import type { Memorial } from '$lib/types/memorial';
    import { Heart, Eye, Calendar, Users, Search, Plus } from 'lucide-svelte';

    let { memorials }: { memorials: Memorial[] } = $props();
    
    console.log('👀 ViewerPortal rendering with', memorials.length, 'followed memorials');

    // Unfollow memorial function
    async function unfollowMemorial(memorialId: string) {
        try {
            const response = await fetch(`/api/memorials/${memorialId}/follow`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Refresh the page to update the list
                window.location.reload();
            } else {
                console.error('Failed to unfollow memorial');
            }
        } catch (error) {
            console.error('Error unfollowing memorial:', error);
        }
    }
</script>

<div class="max-w-6xl mx-auto px-4 py-6">
    <!-- Header Section -->
    <div class="mb-8">
        <div class="flex items-center space-x-4 mb-6">
            <div class="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 flex items-center justify-center shadow-lg">
                <Heart class="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 class="text-3xl font-bold text-gray-900">My Followed Memorials</h1>
                <p class="text-lg text-gray-600">Stay connected with the memorials you care about</p>
            </div>
        </div>
        
        <!-- Quick Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                        <Heart class="w-5 h-5 text-pink-600" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-900">{memorials.length}</p>
                        <p class="text-sm text-gray-600">Following</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <Calendar class="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-900">{memorials.filter(m => m.serviceDate && new Date(m.serviceDate) > new Date()).length}</p>
                        <p class="text-sm text-gray-600">Upcoming Services</p>
                    </div>
                </div>
            </div>
            
            <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
                <div class="flex items-center space-x-3">
                    <div class="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Eye class="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <p class="text-2xl font-bold text-gray-900">{memorials.filter(m => m.livestreamEnabled).length}</p>
                        <p class="text-sm text-gray-600">Live Ready</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Quick Actions -->
    <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Discover</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a 
                href="/search"
                class="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
                <div class="flex items-center space-x-3 mb-3">
                    <Search class="w-6 h-6" />
                    <h3 class="text-lg font-semibold">Find Memorials</h3>
                </div>
                <p class="text-blue-100">Search for memorials to follow and support families</p>
            </a>
            
            <a 
                href="/tributes"
                class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
                <div class="flex items-center space-x-3 mb-3">
                    <Eye class="w-6 h-6" />
                    <h3 class="text-lg font-semibold">Browse All</h3>
                </div>
                <p class="text-emerald-100">Explore public memorials and tributes</p>
            </a>
        </div>
    </div>

    <!-- Followed Memorials -->
    <div class="mb-8">
        <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Followed Memorials</h2>
            <span class="text-sm text-gray-500">{memorials.length} total</span>
        </div>

        {#if memorials && memorials.length > 0}
            <div class="grid gap-4">
                {#each memorials as memorial}
                    <div class="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center space-x-4">
                                <div class="w-12 h-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center shadow-lg">
                                    <span class="text-white font-bold text-lg">
                                        {memorial.lovedOneName?.charAt(0) || 'M'}
                                    </span>
                                </div>
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900">{memorial.lovedOneName}</h3>
                                    <div class="flex items-center space-x-4 text-sm text-gray-500">
                                        <span class="flex items-center">
                                            <Calendar class="w-4 h-4 mr-1" />
                                            {memorial.serviceDate ? new Date(memorial.serviceDate).toLocaleDateString() : 'Date TBD'}
                                        </span>
                                        {#if memorial.livestreamEnabled}
                                            <span class="flex items-center text-green-600">
                                                <Eye class="w-4 h-4 mr-1" />
                                                Live Ready
                                            </span>
                                        {/if}
                                        <span class="flex items-center">
                                            <Users class="w-4 h-4 mr-1" />
                                            {memorial.followerCount || 0} followers
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="flex space-x-2">
                                <a 
                                    href="/tributes/{memorial.slug}"
                                    class="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center space-x-1"
                                >
                                    <Eye class="w-4 h-4" />
                                    <span>View</span>
                                </a>
                                
                                <button 
                                    onclick={() => unfollowMemorial(memorial.id)}
                                    class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    title="Unfollow memorial"
                                >
                                    Following
                                </button>
                            </div>
                        </div>
                        
                        <!-- Memorial Preview -->
                        <div class="mt-4 pt-4 border-t border-gray-100">
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <span class="text-gray-500">Service Location:</span>
                                    <p class="font-medium text-gray-900">{memorial.location?.name || 'Location TBD'}</p>
                                </div>
                                <div>
                                    <span class="text-gray-500">Service Time:</span>
                                    <p class="font-medium text-gray-900">
                                        {memorial.serviceTime || 'Time TBD'}
                                    </p>
                                </div>
                                <div>
                                    <span class="text-gray-500">Duration:</span>
                                    <p class="font-medium text-gray-900">
                                        {memorial.duration ? `${memorial.duration} hours` : 'TBD'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <!-- No followed memorials state -->
            <div class="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200">
                <div class="text-gray-400 text-6xl mb-4">💝</div>
                <h3 class="text-lg font-medium text-gray-900 mb-2">No Followed Memorials</h3>
                <p class="text-gray-600 mb-6">You haven't followed any memorials yet. Discover memorials to stay connected with families and their loved ones.</p>
                <div class="space-x-4">
                    <a 
                        href="/search"
                        class="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 hover:scale-105"
                    >
                        <Search class="w-5 h-5 mr-2" />
                        Find Memorials
                    </a>
                    <a 
                        href="/tributes"
                        class="inline-flex items-center px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Eye class="w-5 h-5 mr-2" />
                        Browse All
                    </a>
                </div>
            </div>
        {/if}
    </div>

    <!-- Logout Button -->
    <div class="mt-12 text-center">
        <form method="POST" action="?/logout">
            <button type="submit" class="text-sm text-gray-500 hover:text-gray-700 hover:underline transition-colors">
                Log Out
            </button>
        </form>
    </div>
</div>
