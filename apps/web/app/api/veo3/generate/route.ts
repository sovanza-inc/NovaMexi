import { NextRequest, NextResponse } from 'next/server'
import { getVEO3API } from '#lib/veo3-api'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      prompt, 
      imageUrls, 
      model, 
      watermark, 
      callBackUrl, 
      aspectRatio, 
      seeds, 
      enableFallback, 
      enableTranslation 
    } = body

    // Validate required fields
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    // Validate prompt length
    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: 'Prompt must be 2000 characters or less' },
        { status: 400 }
      )
    }

    const veo3API = getVEO3API()

    // Prepare options
    const options: any = {}
    if (imageUrls) options.imageUrls = imageUrls
    if (model) options.model = model
    if (watermark) options.watermark = watermark
    if (callBackUrl) options.callBackUrl = callBackUrl
    if (aspectRatio) options.aspectRatio = aspectRatio
    if (seeds) options.seeds = seeds
    if (enableFallback !== undefined) options.enableFallback = enableFallback
    if (enableTranslation !== undefined) options.enableTranslation = enableTranslation

    // Generate video
    const result = await veo3API.generateVideo(prompt, options)

    return NextResponse.json(result)
  } catch (error) {
    console.error('VEO3 Generate Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
