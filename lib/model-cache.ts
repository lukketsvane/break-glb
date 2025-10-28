import { useGLTF } from "@react-three/drei"

interface CacheEntry {
  url: string
  lastAccessed: number
  size: number
}

class ModelCacheManager {
  private cache: Map<string, CacheEntry> = new Map()
  private maxCacheSize = 50 // Maximum number of models to keep in memory
  private maxMemoryMB = 500 // Maximum memory usage in MB (approximate)

  addToCache(url: string) {
    const now = Date.now()

    if (this.cache.has(url)) {
      // Update last accessed time
      const entry = this.cache.get(url)!
      entry.lastAccessed = now
    } else {
      // Add new entry
      this.cache.set(url, {
        url,
        lastAccessed: now,
        size: 10, // Approximate size in MB per model
      })
    }

    // Check if we need to evict old entries
    this.evictIfNeeded()
  }

  private evictIfNeeded() {
    // Check cache size
    if (this.cache.size <= this.maxCacheSize) {
      return
    }

    // Calculate total memory usage
    const totalMemory = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)

    if (totalMemory <= this.maxMemoryMB && this.cache.size <= this.maxCacheSize) {
      return
    }

    // Sort by last accessed time (oldest first)
    const entries = Array.from(this.cache.entries()).sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

    // Remove oldest 20% of entries
    const toRemove = Math.ceil(entries.length * 0.2)

    for (let i = 0; i < toRemove; i++) {
      const [url] = entries[i]
      this.cache.delete(url)

      // Clear from Three.js cache
      try {
        useGLTF.clear(url)
      } catch (error) {
        console.warn("[v0] Failed to clear model from cache:", url)
      }
    }

    console.log(`[v0] Cache cleanup: Removed ${toRemove} models. Cache size: ${this.cache.size}`)
  }

  clearAll() {
    this.cache.forEach((entry) => {
      try {
        useGLTF.clear(entry.url)
      } catch (error) {
        console.warn("[v0] Failed to clear model from cache:", entry.url)
      }
    })
    this.cache.clear()
    console.log("[v0] Cache cleared completely")
  }

  getCacheSize() {
    return this.cache.size
  }

  getTotalMemoryMB() {
    return Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0)
  }
}

export const modelCacheManager = new ModelCacheManager()
