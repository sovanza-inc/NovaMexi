// Simple test file for VEO3 API integration
// This can be run with: npx tsx apps/web/lib/veo3-api.test.ts

import { VEO3API } from './veo3-api'

async function testVEO3API() {
  console.log('🧪 Testing VEO3 API Integration...\n')

  // Test 1: Check if API key is configured
  try {
    const apiKey = process.env.VEO3_API_KEY
    if (!apiKey) {
      console.log('❌ VEO3_API_KEY environment variable is not set')
      console.log('   Please add VEO3_API_KEY=veo_your_api_key_here to your .env file')
      return
    }
    
    if (!apiKey.startsWith('veo_')) {
      console.log('❌ Invalid API key format. Should start with "veo_"')
      return
    }
    
    console.log('✅ API key is configured correctly')
  } catch (error) {
    console.log('❌ Error checking API key:', error)
    return
  }

  // Test 2: Test API connection
  try {
    const api = new VEO3API(process.env.VEO3_API_KEY!)
    
    // Test with a simple prompt
    const testPrompt = 'A simple test video with a blue sky'
    
    console.log('🔄 Testing video generation...')
    console.log('   Prompt:', testPrompt)
    
    const result = await api.generateVideo(testPrompt, {
      model: 'veo3-fast',
      audio: false,
      options: {
        resolution: '720p',
        enhancePrompt: false
      }
    })
    
    console.log('✅ Video generation initiated successfully')
    console.log('   Task ID:', result.taskId)
    console.log('   Status:', result.status)
    console.log('   Credits Required:', result.creditsRequired)
    console.log('   Estimated Time:', result.estimatedTime)
    
    // Test 3: Check status
    console.log('\n🔄 Testing status check...')
    const status = await api.checkStatus(result.taskId)
    console.log('✅ Status check successful')
    console.log('   Current Status:', status.status)
    
    // Test 4: Test logs endpoint
    console.log('\n🔄 Testing logs retrieval...')
    const logs = await api.getLogs({ limit: 5 })
    console.log('✅ Logs retrieval successful')
    console.log('   Logs count:', logs.logs.length)
    
    console.log('\n🎉 All tests passed! VEO3 API integration is working correctly.')
    
  } catch (error) {
    console.log('❌ API test failed:', error)
    
    if (error instanceof Error) {
      if (error.message.includes('401')) {
        console.log('   This usually means the API key is invalid or expired')
      } else if (error.message.includes('429')) {
        console.log('   Rate limit exceeded. Try again later.')
      } else if (error.message.includes('400')) {
        console.log('   Bad request. Check your API key and parameters.')
      }
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testVEO3API()
}

export { testVEO3API }
