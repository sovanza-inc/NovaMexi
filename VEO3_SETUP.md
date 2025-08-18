# VEO3 API Integration Setup

This guide will help you set up the VEO3 Gen API integration for video generation in your NovaMexi application.

## Prerequisites

1. A VEO3 Gen API key from [veo3gen.app](https://veo3gen.app)
2. Node.js and npm/yarn installed
3. Access to your application's environment configuration

## Setup Instructions

### 1. Get Your VEO3 API Key

1. Visit [veo3gen.app](https://veo3gen.app)
2. Sign up for an account
3. Navigate to your API settings
4. Copy your API key (starts with `veo_`)

### 2. Configure Environment Variables

Add the following environment variable to your `.env` file:

```bash
# VEO3 API
VEO3_API_KEY=veo_your_actual_api_key_here
```

### 3. API Endpoints

The integration provides the following API endpoints:

- `POST /api/veo3/generate` - Generate a new video
- `GET /api/veo3/status/[taskId]` - Check generation status
- `GET /api/veo3/logs` - Retrieve generation logs

### 4. Usage

#### Frontend Integration

The explore page now includes:

- **Prompt Input**: Enter your video description
- **Generation Options**:
  - Model: Choose between "Fast" (good quality) or "Quality" (higher quality)
  - Resolution: 720p or 1080p
  - Audio: Enable/disable audio generation
  - Enhance Prompt: Automatically improve your prompt
  - Negative Prompt: Specify what to avoid in the video

#### API Usage Examples

```typescript
// Generate a video
const response = await fetch('/api/veo3/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A majestic eagle soaring through the mountains',
    model: 'veo3-quality',
    resolution: '1080p',
    audio: true,
    enhancePrompt: true
  })
})

// Check status
const status = await fetch(`/api/veo3/status/${taskId}`)
```

### 5. Features

- **Real-time Progress**: Shows generation progress with status updates
- **Video Preview**: Generated videos can be previewed directly in the browser
- **Download Support**: Videos can be downloaded to your device
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Toast Notifications**: Real-time feedback on generation status

### 6. Supported Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model` | `'veo3-fast' \| 'veo3-quality'` | `'veo3-fast'` | Video generation model |
| `prompt` | `string` | Required | Video description (max 2000 chars) |
| `resolution` | `'720p' \| '1080p'` | `'720p'` | Video resolution |
| `audio` | `boolean` | `true` | Include audio in video |
| `negativePrompt` | `string` | Optional | What to avoid in the video |
| `enhancePrompt` | `boolean` | `true` | Automatically enhance the prompt |

### 7. Error Handling

The integration handles various error scenarios:

- **Invalid API Key**: 401 Unauthorized
- **Insufficient Credits**: 400 Bad Request
- **Rate Limit Exceeded**: 429 Too Many Requests
- **Content Policy Violation**: 400 Bad Request
- **System Errors**: 500 Internal Server Error

### 8. Testing

1. Start your development server
2. Navigate to the Explore page
3. Enter a prompt and configure options
4. Click "Create Video"
5. Wait for generation to complete
6. Preview and download your video

### 9. Troubleshooting

#### Common Issues

1. **"VEO3_API_KEY environment variable is not set"**
   - Ensure you've added the API key to your `.env` file
   - Restart your development server

2. **"Invalid API key"**
   - Verify your API key is correct
   - Check that it starts with `veo_`

3. **"Insufficient credits"**
   - Add credits to your VEO3 account
   - Check your credit balance

4. **Generation fails**
   - Check the prompt for policy violations
   - Try a different prompt
   - Verify your internet connection

### 10. Support

For issues with the VEO3 API:
- Visit [veo3gen.app/api-docs](https://veo3gen.app/api-docs)
- Check the VEO3 documentation
- Contact VEO3 support

For issues with this integration:
- Check the application logs
- Verify environment configuration
- Review the API response for error details
