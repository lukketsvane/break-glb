"use server"

import { list } from "@vercel/blob"

export async function getChairModels() {
  try {
    const { blobs } = await list()

    // Filter for GLB files only and sort by pathname
    const glbFiles = blobs
      .filter((blob) => blob.pathname.toLowerCase().endsWith(".glb"))
      .sort((a, b) => a.pathname.localeCompare(b.pathname))
      .map((blob) => blob.url)

    return glbFiles
  } catch (error) {
    console.error("[v0] Error fetching chair models:", error)
    return []
  }
}
