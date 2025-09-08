// VEO3 API Integration Test
// This file can be used to test the new VEO3 API integration

import { getVEO3API } from './veo3-api'

async function testVEO3Integration() {
  try {
    console.log('Testing VEO3 API Integration...')
    
    const veo3API = getVEO3API()
    
    // Test 1: Generate video without image reference
    console.log('Test 1: Generate video without image reference')
    const generateResponse = await veo3API.generateVideo('A dog playing in a park', {
      aspectRatio: '9:16',
      enableFallback: false,
      enableTranslation: true,
      watermark: 'TestBrand'
    })
    
    console.log('Generate Response:', generateResponse)
    
    if (generateResponse.code === 200) {
      console.log('✅ Video generation initiated successfully')
      console.log('Task ID:', generateResponse.data.taskId)
      
      // Test 2: Check status
      console.log('Test 2: Check status')
      const statusResponse = await veo3API.checkStatus(generateResponse.data.taskId)
      console.log('Status Response:', statusResponse)
      
      if (statusResponse.data) {
        console.log('✅ Status check successful')
        console.log('Task ID:', statusResponse.data.taskId)
        console.log('Success Flag:', statusResponse.data.successFlag)
        console.log('Complete Time:', statusResponse.data.completeTime)
        console.log('Has Response:', !!statusResponse.data.response)
        if (statusResponse.data.response?.resultUrls?.[0] || statusResponse.data.response?.originUrls?.[0]) {
          const videoUrl = statusResponse.data.response.resultUrls?.[0] || statusResponse.data.response.originUrls?.[0]
          console.log('Video URL:', videoUrl)
        }
      }
    } else {
      console.log('❌ Video generation failed:', generateResponse.msg)
    }
    
    // Test 3: Generate video with character consistency
    console.log('Test 3: Generate video with character consistency')
    const characterImageUrl = 'https://file.aiquickdraw.com/imgcompressed/img/compressed_592ffa6d50a3b36f80a46c0cd369dd60.webp'
    
    const characterResponse = await veo3API.generateVideo('A person walking through a bustling city street', {
      imageUrls: [characterImageUrl],
      aspectRatio: '9:16',
      enableFallback: false,
      enableTranslation: true,
      watermark: 'TestBrand'
    })
    
    console.log('Character Consistency Response:', characterResponse)
    
    if (characterResponse.code === 200) {
      console.log('✅ Character consistency video generation initiated successfully')
      console.log('Task ID:', characterResponse.data.taskId)
      
      // Test 4: Poll for completion (with timeout for testing)
      console.log('Test 4: Poll for completion (with 30 second timeout)')
      try {
        const pollResult = await veo3API.pollStatus(characterResponse.data.taskId, 30000) // 30 seconds
        console.log('Poll Result:', pollResult)
        if (pollResult.data.successFlag === 1) {
          console.log('✅ Video generation completed successfully!')
          const videoUrl = pollResult.data.response?.resultUrls?.[0] || pollResult.data.response?.originUrls?.[0]
          if (videoUrl) {
            console.log('Final Video URL:', videoUrl)
          }
        }
      } catch (pollError) {
        const errorMessage = pollError instanceof Error ? pollError.message : 'Unknown error'
        console.log('⚠️ Polling timed out or failed (expected for testing):', errorMessage)
      }
    } else {
      console.log('❌ Character consistency video generation failed:', characterResponse.msg)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Uncomment the line below to run the test
// testVEO3Integration()

export { testVEO3Integration }
