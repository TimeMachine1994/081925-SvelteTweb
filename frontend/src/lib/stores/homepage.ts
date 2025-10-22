import { writable, derived } from 'svelte/store';
import type { HomepageState } from '$lib/types/homepage';

// Initial state
const initialState: HomepageState = {
  lovedOneName: '',
  searchQuery: '',
  activeTab: 'families',
  currentStep: 0
};

// Main homepage state store
export const homepageState = writable<HomepageState>(initialState);

// Derived stores for computed values
export const canCreateTribute = derived(
  homepageState,
  ($state) => $state.lovedOneName.trim().length > 0
);

export const canSearchTributes = derived(
  homepageState,
  ($state) => $state.searchQuery.trim().length > 0
);

export const currentSteps = derived(
  homepageState,
  ($state) => $state.activeTab === 'families' ? 'familySteps' : 'directorSteps'
);

// Action creators for state updates
export const homepageActions = {
  updateLovedOneName: (name: string) => {
    homepageState.update(state => ({ ...state, lovedOneName: name }));
  },
  
  updateSearchQuery: (query: string) => {
    homepageState.update(state => ({ ...state, searchQuery: query }));
  },
  
  setActiveTab: (tab: 'families' | 'directors') => {
    homepageState.update(state => ({ ...state, activeTab: tab, currentStep: 0 }));
  },
  
  setCurrentStep: (step: number) => {
    homepageState.update(state => ({ ...state, currentStep: step }));
  },
  
  reset: () => {
    homepageState.set(initialState);
  }
};
