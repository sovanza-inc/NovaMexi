'use client'

import {
  Box,
  Button,
  Card,
  Container,
  Heading,
  Text,
  VStack,
  Textarea,
  SimpleGrid,
  useColorModeValue,
  Stack,
  Select,
  FormControl,
  FormLabel,
  Switch,
  useToast,
  HStack,
  Badge,
  Progress,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { useState, useEffect } from 'react'
import { PageHeader } from '#features/common/components/page-header'
import { useVEO3API } from '#features/common/hooks/use-veo3-api'
import { useVideoStorage } from '#features/common/hooks/use-video-storage'
import { useStoryGenerator, type StoryScene } from '#features/common/hooks/use-story-generator'
import { useShotstack } from '#features/common/hooks/use-shotstack'
import { LuVideo, LuDownload, LuPlay, LuBookOpen, LuRefreshCw } from 'react-icons/lu'

const hints = [
  'A fluffy panda in sunglasses dances on snowy peak',
  'A warrior in black fur cloak faces a massive dragon',
  'A gentleman learns an axolotl-futuristic car',
  'A bunny in 3d cartoon style playing guitar',
]

export default function ExplorePage() {
  const [storyTitle, setStoryTitle] = useState('')
  const [customDuration, setCustomDuration] = useState(8)
  const [model, setModel] = useState<'veo3-fast' | 'veo3-quality'>('veo3-fast')
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p')
  const [audio, setAudio] = useState(true)
  const [negativePrompt, setNegativePrompt] = useState('')
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [generatedVideo, setGeneratedVideo] = useState<{
    videoUrl: string
    duration: number
    resolution: string
    hasAudio: boolean
    isPreview?: boolean
    frameCount?: number
  } | null>(null)
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressText, setProgressText] = useState('')

  const toast = useToast()
  const {
    generateVideo,
    pollStatus,
    isGenerating,
    isPolling,
    error,
    clearError,
  } = useVEO3API()
  const { saveVideo } = useVideoStorage()
  const { mergeVideos } = useShotstack()
  
  // Video regeneration modal state
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedScene, setSelectedScene] = useState<StoryScene | null>(null)
  const [editingPrompt, setEditingPrompt] = useState('')
  const [isRegeneratingVideo, setIsRegeneratingVideo] = useState(false)
  
  const {
    story,
    isGenerating: isGeneratingStory,
    error: storyError,
    generateStory,
    regenerateStory,
    regenerateScene,
    approveScene,
    approveAllScenes,
    clearStory,
    clearError: clearStoryError,
    canGenerateVideo,
    updateSceneVideoUrl,
  } = useStoryGenerator()

  const handleGenerateStory = async () => {
    if (!storyTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a story title',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    if (customDuration < 8) {
      toast({
        title: 'Error',
        description: 'Video duration must be at least 8 seconds',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      console.log('Generating story with title:', storyTitle, 'duration:', customDuration)
      const generatedStory = await generateStory(storyTitle, customDuration)
      console.log('Generated story result:', generatedStory)
      
      if (generatedStory) {
        const frameCount = generatedStory.scenes?.length || 0
        const totalDuration = generatedStory.totalDuration || 0
        console.log('Story details - frames:', frameCount, 'duration:', totalDuration)
        
        toast({
          title: 'Story Generated Successfully!',
          description: `"${generatedStory.title}" has been created with ${frameCount} scenes (${totalDuration}s total). Approve the scenes to generate videos.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      } else {
        console.log('No story was generated')
      }
    } catch (err) {
      console.error('Story generation error:', err)
    }
  }

  const handleRegenerateStory = async () => {
    if (!storyTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a story title',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const regeneratedStory = await regenerateStory(storyTitle, customDuration)
      if (regeneratedStory) {
        const frameCount = regeneratedStory.scenes.length
        const totalDuration = regeneratedStory.totalDuration
        toast({
          title: 'Story Regenerated Successfully!',
          description: `"${regeneratedStory.title}" has been recreated with ${frameCount} scenes (${totalDuration}s total).`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error('Story regeneration error:', err)
    }
  }

  const handleHintClick = (hint: string) => {
    setStoryTitle(hint)
    toast({
      title: 'Hint Applied',
      description: `"${hint}" has been set as your story title. Click "Generate Story" to continue.`,
      status: 'info',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleRegenerateScene = async (sceneNumber: number) => {
    if (!story) return
    
    try {
      await regenerateScene(sceneNumber, story.title)
      toast({
        title: 'Scene Regenerated',
        description: `Scene ${sceneNumber} has been regenerated. Please review and approve.`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Scene regeneration error:', err)
    }
  }

  const handleApproveScene = (sceneNumber: number) => {
    approveScene(sceneNumber)
    toast({
      title: 'Scene Approved',
      description: `Scene ${sceneNumber} has been approved.`,
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleApproveAllScenes = () => {
    approveAllScenes()
    toast({
      title: 'All Scenes Approved',
      description: 'All scenes have been approved. You can now generate videos!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleGenerate = async () => {
    // Only generate story videos now
    if (story && canGenerateVideo()) {
      await handleGenerateStoryVideo()
      return
    }

    toast({
      title: 'Error',
      description: 'Please generate and approve a story first',
      status: 'error',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleGenerateStoryVideo = async () => {
    if (!story || !canGenerateVideo()) {
      toast({
        title: 'Error',
        description: 'Story must be fully approved before generating videos',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      const approvedScenes = story.scenes.filter(scene => scene.isApproved)
      
      toast({
        title: 'Story Video Generation Started',
        description: `Generating videos for ${approvedScenes.length} approved scenes...`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })

      // Generate videos for each approved scene
      const videoPromises = approvedScenes.map(async (scene) => {
        try {
          console.log(`Starting video generation for Scene ${scene.sceneNumber} with prompt:`, scene.prompt)
          
          const generateResponse = await generateVideo(scene.prompt, {
            model,
            resolution,
            audio,
            negativePrompt: negativePrompt || undefined,
            enhancePrompt,
          })

          console.log(`Scene ${scene.sceneNumber} generateVideo response:`, generateResponse)

          if (!generateResponse) {
            console.log(`Scene ${scene.sceneNumber} - No generateResponse, skipping`)
            return null
          }

          console.log(`Scene ${scene.sceneNumber} - Starting to poll for taskId:`, generateResponse.taskId)

          // Poll for completion
          const result = await pollStatus(generateResponse.taskId)
          
          console.log(`Scene ${scene.sceneNumber} pollStatus result:`, result)
          
          if (result && result.result) {
            // Update the story scene with the video URL (don't save to gallery yet)
            console.log(`Updating scene ${scene.sceneNumber} with video URL:`, result.result.videoUrl)
            updateSceneVideoUrl(scene.sceneNumber, result.result.videoUrl)
            console.log(`Scene ${scene.sceneNumber} update function called`)
            
            // Don't save individual frames to gallery - only the combined video will be saved

            return result.result
          }
        } catch (err) {
          console.error(`Error generating video for scene ${scene.sceneNumber}:`, err)
          return null
        }
      })

      // Wait for all videos to complete
      const results = await Promise.all(videoPromises)
      const successfulVideos = results.filter(result => result !== null)

      if (successfulVideos.length > 0) {
        toast({
          title: 'Story Videos Generated Successfully!',
          description: `${successfulVideos.length} scene videos have been created. Click "Create Combined Video" to merge them and save to gallery.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })

        // Set the first video as the current generated video for display
        if (successfulVideos[0]) {
          setGeneratedVideo({
            videoUrl: successfulVideos[0].videoUrl,
            duration: successfulVideos[0].duration,
            resolution: successfulVideos[0].resolution,
            hasAudio: successfulVideos[0].hasAudio,
            isPreview: false,
            frameCount: 1,
          })
        }
      } else {
        toast({
          title: 'Story Video Generation Failed',
          description: 'Failed to generate any scene videos. Please try again.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    } catch (err) {
      console.error('Story video generation error:', err)
      toast({
        title: 'Error',
        description: 'Failed to generate story videos. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }

  // Open video regeneration modal for a specific scene
  const handleOpenVideoRegeneration = (scene: StoryScene) => {
    setSelectedScene(scene)
    setEditingPrompt(scene.prompt)
    onOpen()
  }

  // Regenerate video for a specific scene
  const handleRegenerateVideo = async () => {
    if (!selectedScene || !story) return

    setIsRegeneratingVideo(true)
    try {
      // Generate new video for this scene
      const result = await generateVideo(editingPrompt, {
        model,
        resolution,
        audio,
        negativePrompt: negativePrompt || undefined,
        enhancePrompt,
      })

      if (result?.taskId) {
        const videoResult = await pollStatus(result.taskId)
        if (videoResult?.result?.videoUrl) {
          toast({
            title: 'Video Regenerated!',
            description: `Frame ${selectedScene.sceneNumber} video has been regenerated successfully.`,
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
          
          // Close modal and reset state
          onClose()
          setSelectedScene(null)
          setEditingPrompt('')
        }
      }
    } catch (err) {
      console.error('Video regeneration error:', err)
      toast({
        title: 'Error',
        description: 'Failed to regenerate video. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    } finally {
      setIsRegeneratingVideo(false)
    }
  }

  // Generate combined video from all frame videos using Shotstack
  const handleGenerateCombinedVideo = async () => {
    if (!story) return

    setIsGeneratingVideo(true)
    setProgress(0)
    setProgressText('Creating combined video with Shotstack...')

    try {
      // Get all approved scenes with video URLs
      const approvedScenes = story.scenes.filter(scene => scene.isApproved && scene.videoUrl)
      
      if (approvedScenes.length === 0) {
        throw new Error('No approved scenes with videos found')
      }

      console.log('Starting video merge with Shotstack...')
      console.log('Approved scenes:', approvedScenes.length)
      console.log('Video URLs:', approvedScenes.map(s => s.videoUrl))

      setProgress(25)
      setProgressText('Preparing video frames for merging...')

      // Extract video URLs from approved scenes
      const videoUrls = approvedScenes.map(scene => scene.videoUrl!)
      const frameDuration = 8 // Each frame is 8 seconds

      setProgress(50)
      setProgressText('Merging videos with Shotstack API...')

      // Use Shotstack to merge all videos
      const mergedVideoUrl = await mergeVideos(videoUrls, frameDuration)
      
      console.log('Video merge completed successfully!')
      console.log('Merged video URL:', mergedVideoUrl)

      setProgress(75)
      setProgressText('Finalizing combined video...')

      // Create the combined video object with the real merged video
      const combinedVideo = {
        videoUrl: mergedVideoUrl,
        duration: story.totalDuration,
        resolution,
        hasAudio: audio,
        isCombined: true,
        isPreview: false, // This is now a real combined video, not a preview
        frameCount: approvedScenes.length,
        totalDuration: story.totalDuration,
        frameDuration: frameDuration,
      }
      
      console.log('Combined video object created:', combinedVideo)

      // Save combined video to gallery
      const saveData = {
        prompt: `🎬 COMBINED VIDEO: ${story.title} (${approvedScenes.length} frames, ${story.totalDuration}s total)`,
        model: 'shotstack-merge',
        videoUrl: mergedVideoUrl,
        duration: story.totalDuration,
        resolution: combinedVideo.resolution,
        hasAudio: combinedVideo.hasAudio,
        taskId: `combined_${Date.now()}`,
      }
      
      console.log('Saving combined video with data:', saveData)
      
      const savedVideo = await saveVideo(saveData)

      console.log('Combined video saved to gallery:', savedVideo)

      // Notify gallery page about the new combined video
    setTimeout(() => {
        window.dispatchEvent(new CustomEvent('videoSaved', { detail: savedVideo }))
      }, 100)

      setProgress(100)
      setGeneratedVideo(combinedVideo)
      setProgressText('Combined video created successfully with Shotstack!')
      
      toast({
        title: 'Success! 🎬',
        description: 'Real combined video has been created and saved to gallery!',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
    } catch (err) {
      console.error('Combined video generation error:', err)
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      
      toast({
        title: 'Error',
        description: `Failed to create combined video: ${errorMessage}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setIsGeneratingVideo(false)
      setProgress(0)
      setProgressText('')
    }
  }

  const handleDownload = async () => {
    if (generatedVideo?.videoUrl) {
      try {
        toast({
          title: 'Starting Download',
          description: 'Preparing video for download...',
          status: 'info',
          duration: 2000,
          isClosable: true,
        })

        // Use our API route to avoid CORS issues
        const response = await fetch('/api/download-video', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoUrl: generatedVideo.videoUrl,
            filename: `veo3-video-${Date.now()}.mp4`
          })
        })

        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = `veo3-video-${Date.now()}.mp4`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)

          toast({
            title: 'Download Complete',
            description: 'Video has been downloaded successfully.',
            status: 'success',
            duration: 3000,
            isClosable: true,
          })
        } else {
          throw new Error('Download failed')
        }
      } catch (error) {
        console.error('Download error:', error)
        toast({
          title: 'Download Failed',
          description: 'Could not download the video. Please try again.',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  }

  const handlePlay = () => {
    if (generatedVideo?.videoUrl) {
      window.open(generatedVideo.videoUrl, '_blank')
    }
  }

  // Clear error when component unmounts or error changes
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: error,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      clearError()
    }
  }, [error, toast, clearError])

  // Clear story error when component unmounts or error changes
  useEffect(() => {
    if (storyError) {
      toast({
        title: 'Story Generation Error',
        description: storyError,
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
      clearStoryError()
    }
  }, [storyError, toast, clearStoryError])

  // Monitor story state changes for debugging
  useEffect(() => {
    if (story) {
      console.log('Story state changed:', {
        title: story.title,
        scenes: story.scenes.map(s => ({ 
          num: s.sceneNumber, 
          approved: s.isApproved, 
          hasVideo: !!s.videoUrl,
          videoUrl: s.videoUrl 
        }))
      })
    }
  }, [story])

  const cardBg = useColorModeValue('white', 'gray.800')
  const hintBg = useColorModeValue('purple.50', 'whiteAlpha.100')
  const hintHoverBg = useColorModeValue('purple.100', 'whiteAlpha.200')

  return (
    <Page>
      <PageHeader
        title="Explore"
      />
      <PageBody>
        <Container 
          maxW="container.xl" 
          py={{ base: 4, md: 8 }}
          px={{ base: 4, md: 8 }}
        >
          <VStack spacing={{ base: 6, md: 8 }} align="stretch">
            <Box textAlign="center">
              <Heading 
                size={{ base: "lg", md: "xl" }} 
                mb={{ base: 2, md: 3 }}
                px={{ base: 2, md: 0 }}
              >
                Transform{' '}
                <Text 
                  as="span" 
                  color="purple.400"
                  display={{ base: 'block', md: 'inline' }}
                >
                  Ideas to Visual
                </Text>
              </Heading>
              <Text 
                fontSize={{ base: "md", md: "lg" }} 
                color="gray.500"
                px={{ base: 2, md: 0 }}
              >
                  Generate stories with custom duration and create videos from your ideas
              </Text>
            </Box>

            {/* Story Generation Card */}
            <Card 
              p={{ base: 4, md: 6 }} 
              bg={cardBg} 
              borderRadius={{ base: "lg", md: "xl" }} 
              boxShadow="xl"
            >
              <Stack spacing={6} align="stretch">
                <Box>
                  <HStack spacing={3} mb={3}>
                    <Icon as={LuBookOpen} color="purple.400" />
                    <Heading size="md">Story Generation</Heading>
                  </HStack>
                  <Text mb={4} color="gray.600" fontSize="sm">
                    Provide a story title and duration, AI will generate a complete story with optimal structure
                  </Text>
                </Box>

                {/* Story Title Input */}
                <Box>
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.600">
                    Story Title
                  </Text>
                <Textarea
                    value={storyTitle}
                    onChange={(e) => setStoryTitle(e.target.value)}
                    placeholder="Enter your story title (e.g., 'The Adventure Begins', 'Love in Paris', 'Mystery at Midnight')"
                  size="lg"
                    minH="80px"
                  resize="none"
                  bg="transparent"
                  fontSize={{ base: "sm", md: "md" }}
                  p={{ base: 3, md: 4 }}
                  _focus={{
                    borderColor: 'purple.400',
                    boxShadow: '0 0 0 1px var(--chakra-colors-purple-400)',
                  }}
                />
                </Box>

                {/* Video Duration Input */}
                <Box>
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.600">
                    Video Duration (seconds)
                  </Text>
                  <VStack spacing={4} align="stretch">
                    <FormControl>
                      <FormLabel fontSize="sm">Select Duration</FormLabel>
                      <Select
                        placeholder="Choose duration"
                        value={customDuration}
                        onChange={(e) => setCustomDuration(Number(e.target.value))}
                        size="md"
                      >
                        <option value={8}>8s</option>
                        <option value={16}>16s</option>
                        <option value={24}>24s</option>
                        <option value={32}>32s</option>
                        <option value={40}>40s</option>
                        <option value={48}>48s</option>
                        <option value={60}>60s</option>
                      </Select>
                    </FormControl>
                    
                    {customDuration > 0 && (
                      <Box p={3} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200">
                        <HStack justify="space-between">
                          <Text fontSize="sm" fontWeight="medium" color="blue.800">
                            Duration: {customDuration} seconds
                          </Text>
                          <Badge colorScheme="blue" variant="solid">
                            {customDuration / 8} frames
                          </Badge>
                        </HStack>
                        <Text fontSize="xs" color="blue.600" mt={1}>
                          Each frame is exactly 8 seconds
                        </Text>
                      </Box>
                    )}
                  </VStack>
                  <Text mt={3} fontSize="xs" color="gray.500">
                    💡 Each frame is exactly 8 seconds. Perfect for VEO3 API compatibility.
                  </Text>
                </Box>

                {/* Story Generation Buttons */}
                <Stack 
                  spacing={3} 
                  align="center"
                  direction={{ base: 'column', md: 'row' }}
                >
                  <Button
                    colorScheme="purple"
                    size={{ base: "lg", md: "md" }}
                    isLoading={isGeneratingStory}
                    loadingText="Generating Story..."
                    onClick={handleGenerateStory}
                    leftIcon={<Icon as={LuBookOpen} />}
                    isDisabled={!storyTitle.trim()}
                    _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                    _active={{ transform: 'translateY(0)' }}
                    transition="all 0.2s"
                    cursor="pointer"
                    w={{ base: "full", md: "auto" }}
                  >
                    Generate Story
                  </Button>
                  {story && (
                    <>
                      <Button
                        colorScheme="blue"
                        size={{ base: "lg", md: "md" }}
                        isLoading={isGeneratingStory}
                        loadingText="Regenerating..."
                        onClick={handleRegenerateStory}
                        leftIcon={<Icon as={LuRefreshCw} />}
                        variant="outline"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        _active={{ transform: 'translateY(0)' }}
                        transition="all 0.2s"
                        cursor="pointer"
                        w={{ base: "full", md: "auto" }}
                      >
                        Regenerate Story
                      </Button>
                      <Button
                        colorScheme="gray"
                        size={{ base: "lg", md: "md" }}
                        onClick={clearStory}
                        variant="ghost"
                        _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                        _active={{ transform: 'translateY(0)' }}
                        transition="all 0.2s"
                        cursor="pointer"
                        w={{ base: "full", md: "auto" }}
                      >
                        Clear Story
                      </Button>
                    </>
                  )}
                </Stack>

                {/* Generated Story Display */}
                {story && (
                  <Box>
                    {/* Debug Info */}
                    <Box mb={3} p={2} bg="yellow.50" borderRadius="md" border="1px" borderColor="yellow.200">
                      <Text fontSize="xs" color="yellow.800">
                        Debug: Story has {story.scenes?.length || 0} scenes, Title: {story.title}, Duration: {story.totalDuration}s
                      </Text>
                      <Stack 
                        mt={2} 
                        spacing={2}
                        direction={{ base: 'column', md: 'row' }}
                        align={{ base: 'stretch', md: 'center' }}
                      >
                        <Button 
                          size={{ base: "sm", md: "xs" }}
                          onClick={() => console.log('Full story object:', story)}
                          _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                          _active={{ transform: 'translateY(0)' }}
                          transition="all 0.2s"
                          cursor="pointer"
                          w={{ base: "full", md: "auto" }}
                        >
                          Log Story
                        </Button>
                        <Button 
                          size={{ base: "sm", md: "xs" }}
                          onClick={() => console.log('Scenes array:', story.scenes)}
                          _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                          _active={{ transform: 'translateY(0)' }}
                          transition="all 0.2s"
                          cursor="pointer"
                          w={{ base: "full", md: "auto" }}
                        >
                          Log Scenes
                        </Button>
                      </Stack>
                    </Box>
                    
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="medium" fontSize="sm" color="gray.600">
                        Generated Story: {story.title}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="green" variant="subtle">
                          {story.totalDuration}s
                        </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                          {story.scenes.length} frames
                        </Badge>
                        {story.isApproved && (
                          <Badge colorScheme="blue" variant="solid">
                            ✓ Approved
                          </Badge>
                        )}
                      </HStack>
                    </HStack>

                    {/* Story Approval Controls */}
                    <HStack spacing={3} mb={4} justify="center">
                      <Button
                        colorScheme="green"
                        size="sm"
                        onClick={handleApproveAllScenes}
                        leftIcon={<Icon as={LuBookOpen} />}
                        variant="outline"
                      >
                        Approve All Scenes
                      </Button>
                    </HStack>
                    
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                      {story.scenes && story.scenes.length > 0 ? (
                        <>
                          {/* <Box p={2} bg="red.50" borderRadius="md" border="1px" borderColor="red.200" mb={2}>
                            <Text fontSize="xs" color="red.800">
                              DEBUG: About to render {story.scenes.length} scenes. Scenes array: {JSON.stringify(story.scenes.map(s => ({ num: s.sceneNumber, approved: s.isApproved })))}
                            </Text>
                          </Box> */}
                          
                          {/* Frame Counter */}
                          <Box p={2} bg="blue.50" borderRadius="md" border="1px" borderColor="blue.200" mb={2} gridColumn="1 / -1">
                            <Text fontSize="sm" color="blue.800" textAlign="center" fontWeight="bold">
                              🎬 DISPLAYING {story.scenes.length} FRAMES - Grid Layout: {story.scenes.length <= 2 ? '1 row' : Math.ceil(story.scenes.length / 2) + ' rows'}
                            </Text>
                          </Box>
                          {story.scenes.map((scene, index) => {
                            console.log(`Rendering scene ${index + 1}/${story.scenes.length}:`, scene)
                        return (
                          <Card
                            key={scene.sceneNumber}
                            p={3}
                            bg={scene.isApproved ? "green.50" : "purple.50"}
                            border="1px solid"
                            borderColor={scene.isApproved ? "green.400" : "purple.200"}
                            position="relative"
                                borderWidth="3px"
                                _before={{
                                  content: `"Frame ${scene.sceneNumber}"`,
                                  position: "absolute",
                                  top: "-10px",
                                  left: "10px",
                                  bg: "red.500",
                                  color: "white",
                                  px: 2,
                                  py: 1,
                                  borderRadius: "md",
                                  fontSize: "xs",
                                  fontWeight: "bold"
                                }}
                          >
                            {/* Scene Status Badge */}
                            <HStack position="absolute" top={2} right={2} spacing={1}>
                              {scene.isApproved && (
                                <Badge colorScheme="green" variant="solid" size="sm">
                                  ✓ Approved
                                </Badge>
                              )}
                            </HStack>

                              <VStack align="end" spacing={3}>
                                <HStack align="end" justify="flex-end" w="full">
                                <Badge colorScheme="blue" variant="subtle">
                                  {scene.duration}s
                                </Badge>
                              </HStack>
                              
                              <Text fontSize="sm" fontWeight="medium">
                                {scene.description}
                              </Text>
                              
                              <Text fontSize="xs" color="gray.600" noOfLines={2}>
                                {scene.prompt}
                              </Text>

                              {/* Scene Action Buttons */}
                              <HStack spacing={2} w="full" justify="flex-end">
                                <HStack spacing={1}>
                                  {!scene.isApproved && (
                                    <Button
                                      size="xs"
                                      colorScheme="green"
                                      variant="outline"
                                      onClick={() => handleApproveScene(scene.sceneNumber)}
                                    >
                                      Approve
                                    </Button>
                                  )}
                                  <Button
                                    size="xs"
                                    colorScheme="blue"
                                    variant="ghost"
                                    onClick={() => handleRegenerateScene(scene.sceneNumber)}
                                  >
                                    Regenerate
                                  </Button>
                                    {scene.isApproved && (
                                      <Button
                                        size="xs"
                                        colorScheme="orange"
                                        variant="outline"
                                        onClick={() => handleOpenVideoRegeneration(scene)}
                                      >
                                        Regenerate Video
                                      </Button>
                                    )}
                                </HStack>
                              </HStack>
                            </VStack>
                          </Card>
                        )
                      })}
                        </>
                      ) : (
                        <Box p={4} textAlign="center" color="gray.500">
                          <Text>No scenes generated yet. Please generate a story first.</Text>
                        </Box>
                      )}
                    </SimpleGrid>
                    
                    <Text mt={3} fontSize="xs" color="gray.500" textAlign="center">
                      💡 Approve scenes to unlock video generation. All approved scenes will be used to generate videos automatically.
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Video Generation Card */}
            <Card 
              p={{ base: 4, md: 6 }} 
              bg={cardBg} 
              borderRadius={{ base: "lg", md: "xl" }} 
              boxShadow="xl"
            >
              <Stack 
                spacing={6} 
                align="stretch"
                direction={{ base: 'column', md: 'column' }}
              >
                <Box>
                  <HStack spacing={3} mb={3}>
                    <Icon as={LuVideo} color="purple.400" />
                    <Heading size="md">Video Generation Options</Heading>
                  </HStack>
                  <Text mb={4} color="gray.600" fontSize="sm">
                    Configure video generation settings for your story scenes
                  </Text>
                </Box>

                {/* Generation Options */}
                <Box>
                  <Text mb={3} fontWeight="medium" fontSize="sm" color="gray.600">
                    Generation Options
                  </Text>
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                    <FormControl>
                      <FormLabel fontSize="sm">Model</FormLabel>
                      <Select
                        value={model}
                        onChange={(e) => setModel(e.target.value as 'veo3-fast' | 'veo3-quality')}
                        size="md"
                      >
                        <option value="veo3-fast">Fast (Good Quality)</option>
                        <option value="veo3-quality">Quality (Higher Quality)</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Resolution</FormLabel>
                      <Select
                        value={resolution}
                        onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                        size="md"
                      >
                        <option value="720p">720p</option>
                        <option value="1080p">1080p</option>
                      </Select>
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Audio</FormLabel>
                      <Switch
                        isChecked={audio}
                        onChange={(e) => setAudio(e.target.checked)}
                        colorScheme="purple"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel fontSize="sm">Enhance Prompt</FormLabel>
                      <Switch
                        isChecked={enhancePrompt}
                        onChange={(e) => setEnhancePrompt(e.target.checked)}
                        colorScheme="purple"
                      />
                    </FormControl>
                  </SimpleGrid>

                  <FormControl mt={4}>
                    <FormLabel fontSize="sm">Negative Prompt (Optional)</FormLabel>
                    <Textarea
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="Describe what you want to avoid in the video..."
                      size="md"
                      minH="80px"
                      resize="none"
                    />
                  </FormControl>
                </Box>

                {/* Generate Buttons */}
                <Box textAlign={{ base: "center", md: "right" }}>
                  <Stack 
                    spacing={3} 
                    align="center"
                    direction={{ base: 'column', md: 'row' }}
                    justify={{ base: "center", md: "flex-end" }}
                  >
                  <Button
                    colorScheme="purple"
                      size={{ base: "lg", md: "lg" }}
                    isLoading={isGenerating || isPolling}
                    loadingText={isGenerating ? "Generating Story Videos..." : "Processing..."}
                    onClick={handleGenerate}
                    px={{ base: 6, md: 8 }}
                    leftIcon={<Icon as={LuVideo} />}
                    isDisabled={!story || !canGenerateVideo()}
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s"
                      cursor="pointer"
                      w={{ base: "full", md: "auto" }}
                  >
                    Generate Story Videos
                  </Button>
                    
                    <Button
                      colorScheme="green"
                      size={{ base: "lg", md: "lg" }}
                      isLoading={isGeneratingVideo}
                      loadingText="Creating Combined Video..."
                      onClick={handleGenerateCombinedVideo}
                      px={{ base: 6, md: 8 }}
                      leftIcon={<Icon as={LuVideo} />}
                      isDisabled={!story || !canGenerateVideo()}
                      _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
                      _active={{ transform: 'translateY(0)' }}
                      transition="all 0.2s"
                      cursor="pointer"
                      w={{ base: "full", md: "auto" }}
                    >
                      Create Combined Video
                    </Button>
                  </Stack>
                </Box>

                {/* Progress Indicator */}
                {(isGenerating || isPolling) && (
                  <Box>
                    <Progress
                      size="sm"
                      isIndeterminate
                      colorScheme="purple"
                      borderRadius="md"
                    />
                    <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                      {isGenerating ? "Starting story video generation..." : "Processing your story videos..."}
                    </Text>
                  </Box>
                )}

                {/* Combined Video Progress Indicator */}
                {isGeneratingVideo && (
                  <Box>
                    <Progress
                      size="sm"
                      value={progress}
                      colorScheme="green"
                      borderRadius="md"
                    />
                    <Text mt={2} fontSize="sm" color="gray.500" textAlign="center">
                      {progressText}
                    </Text>
                  </Box>
                )}
              </Stack>
            </Card>

            {/* Video Frames Display */}
            {story && story.scenes.some(scene => scene.isApproved) && (
              <Card 
                p={{ base: 4, md: 6 }} 
                bg={cardBg} 
                borderRadius={{ base: "lg", md: "xl" }} 
                boxShadow="xl"
              >
                <Stack spacing={6} align="stretch">
                  <Box>
                    <HStack spacing={3} mb={3}>
                      <Icon as={LuVideo} color="green.400" />
                      <Heading size="md">Video Frames</Heading>
                    </HStack>
                    <Text mb={4} color="gray.600" fontSize="sm">
                      Individual video frames generated for each approved scene
                    </Text>
                    
                    {/* Debug Info for Video URLs */}
                
                  </Box>

                  {/* Video Frames Grid */}
                  <SimpleGrid columns={{ base: 1, md: 2 }} spacing={3}>
                    {story.scenes
                      .filter(scene => scene.isApproved)
                      .map((scene) => (
                        <Card
                          key={`video-${scene.sceneNumber}`}
                          p={3}
                          bg="blue.50"
                          border="1px solid"
                          borderColor="blue.200"
                          position="relative"
                          borderWidth="3px"
                          _before={{
                            content: `"Video Frame ${scene.sceneNumber}"`,
                            position: "absolute",
                            top: "-10px",
                            left: "10px",
                            bg: "blue.500",
                            color: "white",
                            px: 2,
                            py: 1,
                            borderRadius: "md",
                            fontSize: "xs",
                            fontWeight: "bold"
                          }}
                        >
                          {/* Video Status Badge */}
                          {/* <HStack position="absolute" top={2} right={2} spacing={1}>
                            <Badge colorScheme="blue" variant="solid" size="sm">
                              Video Frame
                            </Badge>
                          </HStack> */}

                          <VStack align="end" spacing={3}>
                            <HStack justify="flex-end" w="full">
                              <Badge colorScheme="blue" variant="subtle">
                                {scene.duration}s
                              </Badge>
                            </HStack>
                            
                            {/* Video Display Area */}
                            <Box
                              bg="black"
                              borderRadius="lg"
                              overflow="hidden"
                              position="relative"
                              h="200px"
                              w="100%"
                              border="2px dashed"
                              borderColor="blue.300"
                            >
                              {scene.videoUrl && scene.videoUrl !== 'generating...' && scene.videoUrl !== 'polling...' ? (
                                <video
                                  src={scene.videoUrl}
                                  controls
                                  style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    objectFit: 'cover',
                                    minHeight: '120px',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0
                                  }}
                                  preload="metadata"
                                  onError={(e) => {
                                    console.error(`Video error for frame ${scene.sceneNumber}:`, e)
                                    console.error(`Video URL that failed:`, scene.videoUrl)
                                    console.error(`Video element:`, e.target)
                                  }}
                                  onLoadStart={() => console.log(`Video loading for frame ${scene.sceneNumber}:`, scene.videoUrl)}
                                  onLoadedData={() => console.log(`Video loaded successfully for frame ${scene.sceneNumber}`)}
                                  onCanPlay={() => console.log(`Video can play for frame ${scene.sceneNumber}`)}
                                />
                              ) : (
                                <VStack spacing={2} color="blue.300">
                                  <Icon as={LuVideo} boxSize={6} />
                                  <Text fontSize="xs" textAlign="center">
                                    {scene.isApproved ? 'Generating video...' : 'Approve scene first'}
                                  </Text>
                                  {scene.isApproved && (
                                    <VStack spacing={1} fontSize="xs" color="blue.200">
                                      <Text>Video URL: {scene.videoUrl || 'Not set'}</Text>
                                      {scene.videoUrl && (
                                        <Text fontSize="xs" color="blue.300" noOfLines={1}>
                                          {scene.videoUrl.length > 50 ? scene.videoUrl.substring(0, 50) + '...' : scene.videoUrl}
                                        </Text>
                                      )}
                                    </VStack>
                                  )}
                                </VStack>
                              )}
                            </Box>

                            {/* Simple Actions */}
                            <HStack spacing={2} w="full" justify="center">
                              <Button
                                size="xs"
                                colorScheme="orange"
                                variant="outline"
                                onClick={() => handleOpenVideoRegeneration(scene)}
                                _hover={{ transform: 'translateY(-1px)', boxShadow: 'md' }}
                                _active={{ transform: 'translateY(0)' }}
                                transition="all 0.2s"
                                cursor="pointer"
                              >
                                Regenerate
                              </Button>
                            </HStack>
                          </VStack>
                        </Card>
                      ))}
                  </SimpleGrid>

                  {story.scenes.filter(scene => scene.isApproved).length === 0 && (
                    <Box p={4} textAlign="center" color="gray.500">
                      <Text>No approved scenes yet. Approve scenes to generate videos.</Text>
                    </Box>
                  )}
                </Stack>
              </Card>
            )}

            {/* Combined Video Display */}
            {story && story.scenes.some(scene => scene.isApproved && scene.videoUrl) && (
              <Card 
                p={{ base: 4, md: 6 }} 
                bg={cardBg} 
                borderRadius={{ base: "lg", md: "xl" }} 
                boxShadow="xl"
              >
                <VStack spacing={4} align="stretch">
                  <Box>
                    <HStack spacing={3} mb={3}>
                      <Icon as={LuVideo} color="green.400" />
                      <Heading size="md">Combined Video</Heading>
                    </HStack>
                    <Text mb={4} color="gray.600" fontSize="sm">
                      Combined video created from all approved video frames
                    </Text>
                    <HStack spacing={4} mb={4}>
                      <Badge colorScheme="green" variant="subtle">
                        {story.scenes.filter(s => s.isApproved && s.videoUrl).length} frames
                      </Badge>
                      <Badge colorScheme="blue" variant="subtle">
                        {story.totalDuration}s
                      </Badge>
                        <Badge colorScheme="purple" variant="subtle">
                        Combined
                        </Badge>
                    </HStack>
                  </Box>

                  <Box
                    bg="black"
                    borderRadius="lg"
                    overflow="hidden"
                    position="relative"
                    h="400px"
                    w="100%"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    {/* Debug info */}
                    {/* {generatedVideo && (
                      <Box position="absolute" top={2} left={2} zIndex={10}>
                        <Text fontSize="xs" color="yellow.300">
                          Debug: URL={generatedVideo.videoUrl?.substring(0, 30)}...
                        </Text>
                      </Box>
                    )}
                     */}
                    {generatedVideo ? (
                      // Show the real combined video
                      generatedVideo.videoUrl && generatedVideo.videoUrl.startsWith('http') ? (
                        // Show video player for real combined video
                        <VStack spacing={3} w="full" h="full">

                          
                          <video
                            src={generatedVideo.videoUrl}
                            controls
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover'
                            }}
                          />
                          
                          {/* Video Information */}
                          <Box 
                            bg="blackAlpha.700" 
                            color="white" 
                            p={3} 
                            borderRadius="md"
                            textAlign="center"
                          >
                            <Text fontSize="sm" fontWeight="bold" mb={1}>
                              🎬 Combined Video Created with Shotstack!
                            </Text>
                            <Text fontSize="xs" color="gray.300">
                              {generatedVideo.frameCount} frames merged into {generatedVideo.duration}s video
                            </Text>
                            <Text fontSize="xs" color="gray.300">
                              Resolution: {generatedVideo.resolution} | Audio: {generatedVideo.hasAudio ? 'Yes' : 'No'}
                            </Text>
                          </Box>

                          <HStack spacing={3} justify="center" mt={2}>
                            <Button
                              size="sm"
                              colorScheme="purple"
                              variant="outline"
                              onClick={handlePlay}
                              leftIcon={<Icon as={LuPlay} />}
                            >
                              Open in New Tab
                            </Button>
                            <Button
                              size="sm"
                              colorScheme="green"
                              onClick={handleDownload}
                              leftIcon={<Icon as={LuDownload} />}
                            >
                              Download
                            </Button>
                          </HStack>
                        </VStack>
                      ) : (
                        // Show success message for combined video
                        <VStack spacing={4} color="white" textAlign="center">
                          <Icon as={LuVideo} boxSize={16} color="green.400" />
                          <Text fontSize="xl" fontWeight="bold">
                            🎬 Combined Video Created!
                          </Text>
                          <Text fontSize="md">
                            Duration: {generatedVideo.duration}s | Resolution: {generatedVideo.resolution}
                          </Text>
                          <Text fontSize="sm" color="gray.300">
                            Video has been saved to your gallery
                          </Text>
                          <Text fontSize="xs" color="gray.400" mt={2}>
                            Real combined video generated via Shotstack API
                          </Text>
                        </VStack>
                      )
                    ) : story.scenes.every(scene => scene.isApproved && scene.videoUrl) ? (
                      // All frames ready but no combined video yet
                      <VStack spacing={3} color="white" textAlign="center">
                        <Icon as={LuVideo} boxSize={12} />
                        <Text fontSize="lg" textAlign="center">
                          🎬 All frames ready! Click &ldquo;Create Combined Video&rdquo; above
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          Your combined video will appear here after generation
                        </Text>
                      </VStack>
                    ) : (
                      // Some frames not ready yet
                      <VStack spacing={3} color="white" textAlign="center">
                        <Icon as={LuVideo} boxSize={12} />
                        <Text fontSize="md">
                          {story.scenes.filter(s => s.isApproved && s.videoUrl).length} of {story.scenes.filter(s => s.isApproved).length} frames ready
                        </Text>
                        <Text fontSize="sm" color="gray.300">
                          Approve all scenes and generate videos to create combined video
                        </Text>
                      </VStack>
                    )}
                  </Box>

                  <Text fontSize="sm" color="gray.500" textAlign="center">
                    💡 Use the &ldquo;Create Combined Video&rdquo; button above to combine all approved video frames
                  </Text>
                </VStack>
              </Card>
            )}

            <Box>
              <Text 
                mb={{ base: 3, md: 4 }} 
                fontSize={{ base: "md", md: "lg" }} 
                fontWeight="medium"
                px={{ base: 2, md: 0 }}
              >
                Story Title Hints:
              </Text>
              <SimpleGrid 
                columns={{ base: 1, sm: 2 }} 
                spacing={{ base: 3, md: 4 }}
              >
                {hints.map((hint, index) => (
                  <Card
                    key={index}
                    p={{ base: 3, md: 4 }}
                    bg={hintBg}
                    cursor="pointer"
                    _hover={{ bg: hintHoverBg }}
                    onClick={() => handleHintClick(hint)}
                    fontSize={{ base: "sm", md: "md" }}
                    transition="all 0.2s"
                    _active={{
                      transform: 'scale(0.98)',
                    }}
                  >
                    <Text>{hint}</Text>
                  </Card>
                ))}
              </SimpleGrid>
            </Box>
          </VStack>
        </Container>
      </PageBody>

      {/* Video Regeneration Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Regenerate Video for Frame {selectedScene?.sceneNumber}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.600">
                  Edit the prompt for this frame:
                </Text>
                <Textarea
                  value={editingPrompt}
                  onChange={(e) => setEditingPrompt(e.target.value)}
                  placeholder="Enter your custom prompt for this frame..."
                  rows={4}
                  resize="vertical"
                />
              </Box>
              
              <Box>
                <Text fontSize="sm" color="gray.500">
                  💡 Modify the prompt to change how this frame will be generated. The video will be regenerated with your new description.
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                colorScheme="orange"
                onClick={handleRegenerateVideo}
                isLoading={isRegeneratingVideo}
                loadingText="Regenerating..."
              >
                Regenerate Video
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Page>
  )
} 