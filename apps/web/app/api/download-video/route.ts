import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, filename } = await request.json()

    if (!videoUrl) {
      return NextResponse.json({ error: 'Video URL is required' }, { status: 400 })
    }

    // Fetch the video from the external URL
    const response = await fetch(videoUrl)
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to fetch video' }, { status: 500 })
    }

    // Get the video as a blob
    const videoBlob = await response.blob()

    // Return the video as a blob response
    return new NextResponse(videoBlob, {
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Download video error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
