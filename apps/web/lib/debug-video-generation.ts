// Debug Video Generation
// This file helps debug video generation issues

import { getVEO3API } from './veo3-api'

export async function debugVideoGeneration() {
  console.log('🔍 Starting Video Generation Debug...')
  
  try {
    const veo3API = getVEO3API()
    
    // Test 1: Generate a simple video
    console.log('📹 Generating test video...')
    const generateResponse = await veo3API.generateVideo('A cat playing with a ball', {
      aspectRatio: '9:16',
      enableFallback: false,
      enableTranslation: true,
      watermark: 'DebugTest'
    })
    
    console.log('✅ Generate Response:', generateResponse)
    
    if (generateResponse.code === 200) {
      console.log('📋 Task ID:', generateResponse.data.taskId)
      
      // Test 2: Check status immediately
      console.log('🔍 Checking status immediately...')
      const statusResponse = await veo3API.checkStatus(generateResponse.data.taskId)
      console.log('📊 Status Response:', JSON.stringify(statusResponse, null, 2))
      
      // Test 3: Poll for completion
      console.log('⏳ Polling for completion (30 seconds max)...')
      try {
        const pollResult = await veo3API.pollStatus(generateResponse.data.taskId, 30000)
        console.log('🎉 Poll Result:', JSON.stringify(pollResult, null, 2))
        
        // Check for video URL in different locations
        console.log('🔍 Video URL Search:')
        console.log('  - pollResult.data.response?.resultUrls[0]:', pollResult.data.response?.resultUrls?.[0])
        console.log('  - pollResult.data.response?.originUrls[0]:', pollResult.data.response?.originUrls?.[0])
        
        const videoUrl = pollResult.data.response?.resultUrls?.[0] || pollResult.data.response?.originUrls?.[0]
        
        if (videoUrl) {
          console.log('✅ Video URL found:', videoUrl)
          return {
            success: true,
            videoUrl: videoUrl,
            fullResponse: pollResult
          }
        } else {
          console.log('❌ No video URL found in expected locations')
          return {
            success: false,
            error: 'No video URL found',
            fullResponse: pollResult
          }
        }
      } catch (pollError) {
        console.log('⚠️ Polling failed:', pollError)
        return {
          success: false,
          error: pollError instanceof Error ? pollError.message : 'Unknown error',
          fullResponse: statusResponse
        }
      }
    } else {
      console.log('❌ Video generation failed:', generateResponse.msg)
      return {
        success: false,
        error: generateResponse.msg,
        fullResponse: generateResponse
      }
    }
  } catch (error) {
    console.error('💥 Debug failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fullResponse: null
    }
  }
}

// Helper function to test video URL extraction
export function testVideoUrlExtraction(response: any) {
  console.log('🧪 Testing Video URL Extraction...')
  console.log('Response structure:', JSON.stringify(response, null, 2))
  
  const possiblePaths = [
    'response.data.response.videoUrl',
    'response.data.videoUrl', 
    'response.data.result.videoUrl',
    'response.videoUrl',
    'response.data.response.video_url',
    'response.data.video_url',
    'response.video_url'
  ]
  
  for (const path of possiblePaths) {
    const value = path.split('.').reduce((obj, key) => obj?.[key], response)
    if (value) {
      console.log(`✅ Found video URL at ${path}:`, value)
      return value
    }
  }
  
  console.log('❌ No video URL found in any path')
  return null
}
