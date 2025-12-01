import { create } from 'zustand'

// Example store - you can customize this based on your needs
const useStore = create((set) => ({
  // State
  count: 0,
  user: null,
  
  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}))

export default useStore

