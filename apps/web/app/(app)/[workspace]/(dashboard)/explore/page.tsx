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
import { LuVideo, LuDownload, LuPlay } from 'react-icons/lu'

const hints = [
  'A fluffy panda in sunglasses dances on snowy peak',
  'A warrior in black fur cloak faces a massive dragon',
  'A gentleman learns an axolotl-futuristic car',
  'A bunny in 3d cartoon style playing guitar',
]

export default function ExplorePage() {
  const [prompt, setPrompt] = useState('')
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

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a prompt',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    try {
      // Generate video
      const generateResponse = await generateVideo(prompt, {
        model,
        resolution,
        audio,
        negativePrompt: negativePrompt || undefined,
        enhancePrompt,
      })

      if (!generateResponse) {
        return
      }



      toast({
        title: 'Video Generation Started',
        description: `Estimated time: ${generateResponse.estimatedTime}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
      })

      // Poll for completion
      const result = await pollStatus(generateResponse.taskId)
      
      if (result && result.result) {
        setGeneratedVideo(result.result)
        
        // Save video to storage for gallery
        console.log('Saving video to storage:', {
          videoUrl: result.result.videoUrl,
          prompt,
          model,
          resolution,
          duration: result.result.duration,
          hasAudio: result.result.hasAudio,
          taskId: generateResponse.taskId,
        })
        
        const savedVideo = saveVideo({
          videoUrl: result.result.videoUrl,
          prompt,
          model,
          resolution,
          duration: result.result.duration,
          hasAudio: result.result.hasAudio,
          taskId: generateResponse.taskId,
        })
        
        console.log('Video saved successfully:', savedVideo)
        
        toast({
          title: 'Video Generated Successfully!',
          description: 'Your video is ready to view and download. It has been saved to your gallery.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        })
        
        // Force a small delay to ensure localStorage is updated
        setTimeout(() => {
          // Trigger a custom event to notify gallery page
          window.dispatchEvent(new CustomEvent('videoSaved', { detail: savedVideo }))
        }, 100)
      }
    } catch (err) {
      console.error('Generation error:', err)
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

        // Use a proxy approach to avoid CORS
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
                Type your idea and click &quot;Create&quot; to get a video
              </Text>
            </Box>

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
                {/* Prompt Input */}
                <Box>
                  <Text mb={2} fontWeight="medium" fontSize="sm" color="gray.600">
                    Describe your video idea
                  </Text>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Type your creative idea here..."
                    size="lg"
                    minH={{ base: '100px', md: '150px' }}
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
                    loadingText={isGenerating ? "Creating Video..." : "Processing..."}
                    onClick={handleGenerate}
                    px={{ base: 6, md: 8 }}
                    w={{ base: 'full', md: 'auto' }}
                    leftIcon={<Icon as={LuVideo} />}
                  >
                    Create Video
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
                      {isGenerating ? "Starting video generation..." : "Processing your video..."}
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
                Hints:
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
                    onClick={() => setPrompt(hint)}
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