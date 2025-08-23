import { NextResponse } from 'next/server'
import { ShotstackAPI, ShotstackRenderRequest } from '#lib/shotstack-api'

export async function GET() {
  try {
    const apiKey = process.env.SHOTSTACK_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Shotstack API key not configured' },
        { status: 500 }
      )
    }

    const shotstack = new ShotstackAPI(apiKey)
    
    console.log('Testing Shotstack API connection...')
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...')

    // Test with a simple request
    const testRequest: ShotstackRenderRequest = {
      timeline: {
        background: '#000000',
        tracks: [{
          clips: [{
            asset: {
              type: 'video' as const,
              src: 'https://shotstack.io/static/teaser.mp4'
            },
            start: 0,
            length: 5
          }]
        }]
      },
                     output: {
          format: 'mp4',
          resolution: 'hd',
          fps: 30,
          quality: 'low'
        }
    }

    console.log('Test request:', JSON.stringify(testRequest, null, 2))

    const response = await shotstack.renderVideo(testRequest)
    
    return NextResponse.json({
      success: true,
      message: 'Shotstack API connection successful',
      response: response
    })
  } catch (error) {
    console.error('Shotstack API test error:', error)
    
    return NextResponse.json(
      { 
        error: 'Shotstack API test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
