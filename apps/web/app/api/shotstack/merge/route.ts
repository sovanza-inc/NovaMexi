import { NextRequest, NextResponse } from 'next/server'
import { ShotstackAPI } from '#lib/shotstack-api'

export async function POST(request: NextRequest) {
  try {
    const { videoUrls, frameDuration } = await request.json()

    if (!videoUrls || !Array.isArray(videoUrls) || videoUrls.length === 0) {
      return NextResponse.json(
        { error: 'videoUrls array is required and must not be empty' },
        { status: 400 }
      )
    }

    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Shotstack API key not configured' },
        { status: 500 }
      )
    }

    const shotstack = new ShotstackAPI(apiKey)
    
    console.log('Starting video merge with Shotstack...')
    console.log('Video URLs:', videoUrls)
    console.log('Frame duration:', frameDuration)
    console.log('Number of videos to merge:', videoUrls.length)

    // Validate video URLs
    const validUrls = videoUrls.filter(url => url && url.startsWith('http'))
    if (validUrls.length !== videoUrls.length) {
      console.warn('Some video URLs are invalid:', videoUrls.filter(url => !url || !url.startsWith('http')))
    }
    
    if (validUrls.length === 0) {
      throw new Error('No valid video URLs provided')
    }

    console.log('Valid video URLs:', validUrls)

    const mergedVideoUrl = await shotstack.mergeVideos(validUrls, frameDuration || 8)
    
    console.log('Video merge completed successfully!')
    console.log('Merged video URL:', mergedVideoUrl)

    return NextResponse.json({
      success: true,
      mergedVideoUrl,
      message: 'Videos merged successfully',
    })
  } catch (error) {
    console.error('Shotstack video merge error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to merge videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
