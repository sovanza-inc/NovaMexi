# VEO3 API Migration Guide

## Overview
This document outlines the migration from the old VEO3 API (`api.veo3gen.app`) to the new VEO3 API (`api.veo3api.ai`).

## Key Changes

### 1. Base URL
- **Old**: `https://api.veo3gen.app`
- **New**: `https://api.veo3api.ai`

### 2. API Endpoints
- **Generate Video**: 
  - **Old**: `POST /api/generate`
  - **New**: `POST /api/v1/veo/generate`
- **Check Status**: 
  - **Old**: `GET /api/status/{taskId}`
  - **New**: `GET /api/v1/veo/record-info?taskId={taskId}`

### 3. Request Format Changes

#### Old Request Format
```json
{
  "model": "veo3-fast",
  "prompt": "A dog playing in a park",
  "audio": true,
  "options": {
    "resolution": "720p",
    "aspectRatio": "16:9",
    "enhancePrompt": true
  }
}
```

#### New Request Format
```json
{
  "prompt": "A dog playing in a park",
  "imageUrls": ["http://example.com/image1.jpg"],
  "model": "veo3",
  "watermark": "MyBrand",
  "callBackUrl": "http://your-callback-url.com/complete",
  "aspectRatio": "9:16",
  "seeds": 123456,
  "enableFallback": false,
  "enableTranslation": true
}
```

### 4. Response Format Changes

#### Old Response Format
```json
{
  "success": true,
  "taskId": "abc123",
  "status": "pending",
  "model": "veo3-fast",
  "creditsRequired": 10,
  "estimatedTime": "2 minutes"
}
```

#### New Response Format
```json
{
  "code": 200,
  "msg": "success",
  "data": {
    "taskId": "7cc763596e5eb76149207cf249439cc6"
  }
}
```

## New Features

### 1. Image Reference Support
The new API supports image references for character consistency across video frames:

```typescript
// Using the VEO3API class
const veo3API = getVEO3API()
const result = await veo3API.generateVideoWithCharacterConsistency(
  'A person walking through a bustling city street',
  'https://example.com/character-image.jpg',
  {
    aspectRatio: '9:16',
    watermark: 'MyBrand'
  }
)

// Using the React hook
const { generateVideoWithCharacterConsistency } = useVEO3API()
const result = await generateVideoWithCharacterConsistency(
  'A person walking through a bustling city street',
  'https://example.com/character-image.jpg',
  {
    aspectRatio: '9:16',
    watermark: 'MyBrand'
  }
)
```

### 2. Enhanced Options
- `imageUrls`: Array of image URLs for character reference
- `watermark`: Custom watermark text
- `callBackUrl`: Callback URL for completion notification
- `aspectRatio`: Video aspect ratio (9:16, 16:9, 1:1)
- `seeds`: Random seed for reproducible results
- `enableFallback`: Enable fallback generation
- `enableTranslation`: Enable automatic prompt translation

## Usage Examples

### Basic Video Generation
```typescript
import { useVEO3API } from '#features/common/hooks/use-veo3-api'

function VideoGenerator() {
  const { generateVideo, isGenerating, error } = useVEO3API()

  const handleGenerate = async () => {
    const result = await generateVideo('A dog playing in a park', {
      aspectRatio: '9:16',
      watermark: 'MyBrand',
      enableTranslation: true
    })
    
    if (result) {
      console.log('Video generation started:', result.data.taskId)
    }
  }

  return (
    <div>
      <button onClick={handleGenerate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Video'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

### Character Consistency Video Generation
```typescript
import { useVEO3API } from '#features/common/hooks/use-veo3-api'

function CharacterVideoGenerator() {
  const { generateVideoWithCharacterConsistency, isGenerating, error } = useVEO3API()

  const handleGenerateWithCharacter = async () => {
    const characterImageUrl = 'https://example.com/character.jpg'
    
    const result = await generateVideoWithCharacterConsistency(
      'A person walking through a bustling city street',
      characterImageUrl,
      {
        aspectRatio: '9:16',
        watermark: 'MyBrand',
        enableTranslation: true
      }
    )
    
    if (result) {
      console.log('Character video generation started:', result.data.taskId)
    }
  }

  return (
    <div>
      <button onClick={handleGenerateWithCharacter} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Character Video'}
      </button>
      {error && <p>Error: {error}</p>}
    </div>
  )
}
```

## Migration Checklist

- [x] Update base URL to `https://api.veo3api.ai`
- [x] Update API endpoints to new structure
- [x] Update request format to match new API
- [x] Update response format handling
- [x] Add image reference support for character consistency
- [x] Update React hooks to work with new API
- [x] Update Next.js API routes
- [x] Add helper methods for character consistency
- [x] Test integration with new API

## Testing

To test the integration, you can use the provided test file:

```typescript
import { testVEO3Integration } from '#lib/veo3-api-integration-test'

// Run the test
testVEO3Integration()
```

## Environment Variables

Make sure your environment variables are set:

```env
VEO3_API_KEY=your_api_key_here
```

## Notes

- The new API uses a different response structure, so all existing code that depends on the old response format will need to be updated
- Image references are now supported for maintaining character consistency across video frames
- The new API provides more granular control over video generation options
- All existing functionality has been preserved while adding new features
