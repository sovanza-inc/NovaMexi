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
} from '@chakra-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { useState, useEffect } from 'react'
import { PageHeader } from '#features/common/components/page-header'
import { useVEO3API } from '#features/common/hooks/use-veo3-api'
import { useVideoStorage } from '#features/common/hooks/use-video-storage'
import { useStoryGenerator } from '#features/common/hooks/use-story-generator'
import { LuVideo, LuDownload, LuPlay, LuBookOpen, LuRefreshCw } from 'react-icons/lu'

const hints = [
  'A fluffy panda in sunglasses dances on snowy peak',
  'A warrior in black fur cloak faces a massive dragon',
  'A gentleman learns an axolotl-futuristic car',
  'A bunny in 3d cartoon style playing guitar',
]

export default function ExplorePage() {
  const [storyTitle, setStoryTitle] = useState('')
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
  } | null>(null)

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
    getScenePrompt,
    canGenerateVideo,
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

    try {
      const generatedStory = await generateStory(storyTitle)
      if (generatedStory) {
        toast({
          title: 'Story Generated Successfully!',
          description: `"${generatedStory.title}" has been created with ${generatedStory.scenes.length} scenes. Approve the scenes to generate videos.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
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
      const regeneratedStory = await regenerateStory(storyTitle)
      if (regeneratedStory) {
        toast({
          title: 'Story Regenerated Successfully!',
          description: `"${regeneratedStory.title}" has been recreated with new scenes.`,
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
      const videoPromises = approvedScenes.map(async (scene, index) => {
        try {
          const generateResponse = await generateVideo(scene.prompt, {
            model,
            resolution,
            audio,
            negativePrompt: negativePrompt || undefined,
            enhancePrompt,
          })

          if (!generateResponse) return null

          // Poll for completion
          const result = await pollStatus(generateResponse.taskId)
          
          if (result && result.result) {
            // Save individual scene video
            const savedVideo = saveVideo({
              videoUrl: result.result.videoUrl,
              prompt: scene.prompt,
              model,
              resolution,
              duration: result.result.duration,
              hasAudio: result.result.hasAudio,
              taskId: generateResponse.taskId,
            })

            console.log(`Scene ${scene.sceneNumber} video saved:`, savedVideo)
            
            // Notify gallery
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('videoSaved', { detail: savedVideo }))
            }, 100)

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
          description: `${successfulVideos.length} scene videos have been created and saved to your gallery.`,
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
                Generate stories and create videos from your ideas
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
                    Provide a story title and AI will generate a complete story with 8 scenes of 8 seconds each
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

                {/* Story Generation Buttons */}
                <HStack spacing={3} justify="center">
                  <Button
                    colorScheme="purple"
                    size="md"
                    isLoading={isGeneratingStory}
                    loadingText="Generating Story..."
                    onClick={handleGenerateStory}
                    leftIcon={<Icon as={LuBookOpen} />}
                    isDisabled={!storyTitle.trim()}
                  >
                    Generate Story
                  </Button>
                  {story && (
                    <>
                      <Button
                        colorScheme="blue"
                        size="md"
                        isLoading={isGeneratingStory}
                        loadingText="Regenerating..."
                        onClick={handleRegenerateStory}
                        leftIcon={<Icon as={LuRefreshCw} />}
                        variant="outline"
                      >
                        Regenerate Story
                      </Button>
                      <Button
                        colorScheme="gray"
                        size="md"
                        onClick={clearStory}
                        variant="ghost"
                      >
                        Clear Story
                      </Button>
                    </>
                  )}
                </HStack>

                {/* Generated Story Display */}
                {story && (
                  <Box>
                    <HStack justify="space-between" mb={3}>
                      <Text fontWeight="medium" fontSize="sm" color="gray.600">
                        Generated Story: {story.title}
                      </Text>
                      <HStack spacing={2}>
                        <Badge colorScheme="green" variant="subtle">
                          {story.totalDuration}s • {story.scenes.length} scenes
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
                      {story.scenes.map((scene) => {
                        return (
                          <Card
                            key={scene.sceneNumber}
                            p={3}
                            bg={scene.isApproved ? "green.50" : "purple.50"}
                            border="1px solid"
                            borderColor={scene.isApproved ? "green.400" : "purple.200"}
                            position="relative"
                          >
                            {/* Scene Status Badge */}
                            <HStack position="absolute" top={2} right={2} spacing={1}>
                              {scene.isApproved && (
                                <Badge colorScheme="green" variant="solid" size="sm">
                                  ✓ Approved
                                </Badge>
                              )}
                            </HStack>

                            <VStack align="start" spacing={3}>
                              <HStack justify="space-between" w="full">
                                <Badge colorScheme="purple" variant="subtle">
                                  Scene {scene.sceneNumber}
                                </Badge>
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
                                </HStack>
                              </HStack>
                            </VStack>
                          </Card>
                        )
                      })}
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

                {/* Generate Button */}
                <Box textAlign={{ base: "center", md: "right" }}>
                  <Button
                    colorScheme="purple"
                    size={{ base: "md", md: "lg" }}
                    isLoading={isGenerating || isPolling}
                    loadingText={isGenerating ? "Generating Story Videos..." : "Processing..."}
                    onClick={handleGenerate}
                    px={{ base: 6, md: 8 }}
                    w={{ base: 'full', md: 'auto' }}
                    leftIcon={<Icon as={LuVideo} />}
                    isDisabled={!story || !canGenerateVideo()}
                  >
                    Generate Story Videos
                  </Button>
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
              </Stack>
            </Card>

            {/* Generated Video Display */}
            {generatedVideo && (
              <Card 
                p={{ base: 4, md: 6 }} 
                bg={cardBg} 
                borderRadius={{ base: "lg", md: "xl" }} 
                boxShadow="xl"
              >
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Heading size="md" mb={2}>Generated Video</Heading>
                    <HStack spacing={4} mb={4}>
                      <Badge colorScheme="green" variant="subtle">
                        {generatedVideo.resolution}
                      </Badge>
                      <Badge colorScheme="blue" variant="subtle">
                        {generatedVideo.duration}s
                      </Badge>
                      {generatedVideo.hasAudio && (
                        <Badge colorScheme="purple" variant="subtle">
                          Audio
                        </Badge>
                      )}
                    </HStack>
                  </Box>

                  <Box
                    bg="black"
                    borderRadius="lg"
                    overflow="hidden"
                    position="relative"
                    minH="200px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <video
                      src={generatedVideo.videoUrl}
                      controls
                      style={{ width: '100%', height: 'auto', maxHeight: '400px' }}
                    />
                  </Box>

                  <HStack spacing={3} justify="center">
                    <Button
                      leftIcon={<Icon as={LuPlay} />}
                      onClick={handlePlay}
                      colorScheme="purple"
                      variant="outline"
                    >
                      Open in New Tab
                    </Button>
                    <Button
                      leftIcon={<Icon as={LuDownload} />}
                      onClick={handleDownload}
                      colorScheme="purple"
                    >
                      Download Video
                    </Button>
                  </HStack>
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
    </Page>
  )
} 