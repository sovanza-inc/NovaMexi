# VEO3 API Setup Guide

## Environment Variables

Create a `.env.local` file in your project root with the following variables:

```bash
# VEO3 API Key
VEO3_API_KEY=veo_b9fa5a0e01cb4657b01e17c6a3d96890f8386167

# Shotstack API Key (for video merging)
SHOTSTACK_API_KEY=GzOIHNm7rp95xjTyVGJVv5gTV7EJdgiP5xd0D5FF
```

## API Keys

### VEO3 API Key
- **Key**: `veo_b9fa5a0e01cb4657b01e17c6a3d96890f8386167`
- **Purpose**: Video generation
- **Usage**: 15 credits per video

### Shotstack API Key
- **Key**: `GzOIHNm7rp95xjTyVGJVv5gTV7EJdgiP5xd0D5FF`
- **Purpose**: Video merging and combining
- **Usage**: 100 free videos/month

## Setup Steps

1. **Create `.env.local`** file in project root
2. **Add both API keys** as shown above
3. **Restart your development server**
4. **Test the integration**

## Features

- ✅ **VEO3**: Generate individual video frames
- ✅ **Shotstack**: Merge frames into combined videos
- ✅ **Real video combining** (no more preview mode!)
- ✅ **Professional output** quality

## Testing

1. Generate a story with multiple scenes
2. Approve scenes and generate individual videos
3. Click "Create Combined Video" to merge with Shotstack
4. Real combined video will be created and saved to gallery
