import { create } from "zustand"

interface CryptoState {
  masterKey: string | null
  setMasterKey: (key: string) => void
  clearMasterKey: () => void
}

export const useCryptoStore = create<CryptoState>()((set) => ({
  masterKey: null,
  setMasterKey: (key) => set({ masterKey: key }),
  clearMasterKey: () => set({ masterKey: null }),
}))