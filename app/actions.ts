"use server"

import { unstable_cache } from "next/cache"

const NOTION_API_KEY = process.env.NOTION_API_KEY || "ntn_J76253346485Lux1eAl3mzB3E2VdgRQNSd5hppo188MblR"
const DATABASE_ID = "2961c6815f7880a083eefe9705d6306c"
const NOTION_VERSION = "2022-06-28"

const CACHE_REVALIDATE_SECONDS = 300

interface ChairData {
  url: string
  name: string
  designer: string
  year: string
  type: string
  period: string
  owner: string
  dimensions: {
    height: number
    width: number
    depth: number
  }
  materials: string
  tags: string[]
  notes: string
  classification: string
  source: string
}

interface ChairModel {
  url: string
  data: ChairData
}

const queryNotionDatabase = unstable_cache(
  async () => {
    let allResults: any[] = []
    let hasMore = true
    let startCursor: string | undefined = undefined
    let pageCount = 0
    const maxPages = 10 // Safety limit to prevent infinite loops

    while (hasMore && pageCount < maxPages) {
      try {
        const response = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${NOTION_API_KEY}`,
            "Notion-Version": NOTION_VERSION,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sorts: [
              {
                property: "Name",
                direction: "ascending",
              },
            ],
            start_cursor: startCursor,
            page_size: 100,
          }),
          signal: AbortSignal.timeout(10000), // 10 second timeout per request
        })

        if (!response.ok) {
          const error = await response.text()
          console.error("[v0] Notion API error:", error)
          throw new Error(`Notion API error: ${response.status}`)
        }

        const data = await response.json()
        allResults = allResults.concat(data.results)
        hasMore = data.has_more
        startCursor = data.next_cursor
        pageCount++

        console.log("[v0] Fetched page", pageCount, "with", data.results.length, "entries. Total:", allResults.length)
      } catch (error) {
        console.error("[v0] Error fetching Notion page:", error)
        break
      }
    }

    return { results: allResults }
  },
  ["notion-database-query"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ["notion-data"],
  },
)

const getChairModelsWithData = unstable_cache(
  async (): Promise<ChairModel[]> => {
    try {
      console.log("[v0] Fetching chair models with data from cache/Notion")

      const data = await queryNotionDatabase()

      console.log("[v0] Total pages found:", data.results.length)

      const chairs: ChairModel[] = []

      for (const page of data.results) {
        const props = page.properties

        const extractText = (prop: any): string => {
          if (!prop) return ""
          if (prop.select?.name) return prop.select.name
          if (prop.multi_select?.[0]?.name) return prop.multi_select.map((s: any) => s.name).join(", ")
          if (prop.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text
          if (prop.title?.[0]?.plain_text) return prop.title[0].plain_text
          if (prop.number) return prop.number.toString()
          if (prop.url) return prop.url
          return ""
        }

        let url = props?.glb_url?.url || ""

        if (!url) {
          const files = props?.GLB?.files || []
          url = files.length > 0 ? files[0].file?.url || files[0].external?.url || "" : ""
        }

        if (!url) continue

        const name = extractText(props?.Name) || "Unknown"
        const designer = extractText(props?.kunstnar_produsent)
        const year = props?.år?.number?.toString() || extractText(props?.år)
        const type = extractText(props?.objekttype) || extractText(props?.klassifikasjon) || ""
        const period = extractText(props?.stilperiode) || ""
        const owner = extractText(props?.eigar_samling)

        const height = props?.H_mm?.number || 0
        const width = props?.B_mm?.number || 0
        const depth = props?.D_mm?.number || 0
        const dimensions = { height, width, depth }

        const materials =
          extractText(props?.materiale_teknikk) ||
          extractText(props?.materiale_teknikkar) ||
          extractText(props?.materiale) ||
          ""

        const tags = props?.stikkord?.multi_select?.map((tag: any) => tag.name) || []
        const notes = extractText(props?.notater)
        const classification = extractText(props?.klassifikasjon)
        const source = extractText(props?.kjelde)

        chairs.push({
          url,
          data: {
            url,
            name,
            designer,
            year,
            type,
            period,
            owner,
            dimensions,
            materials,
            tags,
            notes,
            classification,
            source,
          },
        })
      }

      console.log("[v0] Total chairs with GLB files:", chairs.length)
      return chairs
    } catch (error) {
      console.error("[v0] Failed to load chair models:", error)
      return []
    }
  },
  ["notion-chairs-with-data"],
  {
    revalidate: CACHE_REVALIDATE_SECONDS,
    tags: ["notion-data"],
  },
)

export async function getChairModels(): Promise<string[]> {
  const chairs = await getChairModelsWithData()
  return chairs.map((chair) => chair.url)
}

export async function getChairData(index: number): Promise<ChairData | null> {
  try {
    console.log("[v0] Fetching chair data for index:", index)

    const chairs = await getChairModelsWithData()

    if (index < 0 || index >= chairs.length) {
      console.log("[v0] Index out of bounds:", index, "of", chairs.length)
      return null
    }

    const chairData = chairs[index].data
    console.log("[v0] Returning chair data:", chairData.name)
    return chairData
  } catch (error) {
    console.error("[v0] Failed to load chair data:", error)
    return null
  }
}
