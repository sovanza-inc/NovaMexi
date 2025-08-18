'use client'

import { useEffect } from 'react'
import {
  Box,
  Container,
  Text,
  VStack,
  Wrap,
  WrapItem,
  HStack,
  Badge,
  IconButton,
  useToast,
  useColorModeValue,
  Icon,
  Button,
} from '@chakra-ui/react'
import { EmptyState } from '@saas-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { PageHeader } from '#features/common/components/page-header'
import { useVideoStorage } from '#features/common/hooks/use-video-storage'
import { LuVideo, LuTrash2, LuDownload, LuPlay, LuCalendar } from 'react-icons/lu'

export default function GalleryPage() {
  const { videos, deleteVideo, clearAllVideos, refreshVideos } = useVideoStorage()
  const toast = useToast()
  const cardBg = useColorModeValue('white', 'gray.800')
  
  // Debug: Log videos on component mount and when videos change
  console.log('Gallery page - videos loaded:', videos)
  
  // Listen for video saved events from explore page
  useEffect(() => {
    const handleVideoSaved = (event: CustomEvent) => {
      console.log('Gallery received video saved event:', event.detail)
      // Force refresh videos from localStorage
      refreshVideos()
    }
    
    window.addEventListener('videoSaved', handleVideoSaved as EventListener)
    
    return () => {
      window.removeEventListener('videoSaved', handleVideoSaved as EventListener)
    }
  }, [refreshVideos])

  const handleDeleteVideo = (videoId: string) => {
    deleteVideo(videoId)
    toast({
      title: 'Video Deleted',
      description: 'Video has been removed from your gallery.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    })
  }

  const handleDownload = async (videoUrl: string, prompt: string) => {
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
          videoUrl: videoUrl,
          filename: `veo3-${prompt.substring(0, 20).replace(/\s+/g, '-')}-${Date.now()}.mp4`
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `veo3-${prompt.substring(0, 20).replace(/\s+/g, '-')}-${Date.now()}.mp4`
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

  const handlePlay = (videoUrl: string) => {
    window.open(videoUrl, '_blank')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

    return (
    <Page>
      <PageHeader
        title="Gallery"
      />
      <PageBody>
        <Container maxW="container.xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            {/* Header with Clear All button */}
            <HStack justify="space-between" align="center">
              <Text 
                fontSize={{ base: "xl", md: "2xl" }} 
                fontWeight="bold"
                mb={{ base: 1, md: 2 }}
              >
                Your Generated Videos
              </Text>
                             <HStack spacing={2}>
                                   <Button
                    leftIcon={<Icon as={LuVideo} />}
                    variant="outline"
                    colorScheme="blue"
                    size="sm"
                    onClick={() => {
                      refreshVideos()
                      toast({
                        title: 'Gallery Refreshed',
                        description: 'Videos have been refreshed from storage.',
                        status: 'info',
                        duration: 2000,
                        isClosable: true,
                      })
                    }}
                  >
                    Refresh
                  </Button>
                  {/* <Button
                    leftIcon={<Icon as={LuVideo} />}
                    variant="outline"
                    colorScheme="green"
                    size="sm"
                    onClick={() => {
                      // Test: Add a sample video to localStorage
                      const testVideo = {
                        id: `test_${Date.now()}`,
                        videoUrl: 'https://storage.googleapis.com/veo3videosave/veo3-fast/2025-08-18T20-15-31-399Z/10406687066482554836/sample_0.mp4',
                        prompt: 'Test video - A warrior in black fur cloak faces a massive dragon',
                        model: 'veo3-fast',
                        resolution: '720p',
                        duration: 8,
                        hasAudio: true,
                        createdAt: new Date().toISOString(),
                        taskId: 'test_task_123'
                      }
                      
                      const currentVideos = JSON.parse(localStorage.getItem('veo3_generated_videos') || '[]')
                      const updatedVideos = [testVideo, ...currentVideos]
                      localStorage.setItem('veo3_generated_videos', JSON.stringify(updatedVideos))
                      
                      refreshVideos()
                      toast({
                        title: 'Test Video Added',
                        description: 'Added a test video to localStorage.',
                        status: 'success',
                        duration: 2000,
                        isClosable: true,
                      })
                    }}
                  >
                    Add Test Video
                  </Button> */}
                 {videos.length > 0 && (
                   <Button
                     leftIcon={<Icon as={LuTrash2} />}
                     variant="outline"
                     colorScheme="red"
                     size="sm"
                     onClick={() => {
                       if (confirm('Are you sure you want to delete all videos?')) {
                         clearAllVideos()
                         toast({
                           title: 'Gallery Cleared',
                           description: 'All videos have been removed.',
                           status: 'success',
                           duration: 3000,
                           isClosable: true,
                         })
                       }
                     }}
                   >
                     Clear All
                   </Button>
                 )}
               </HStack>
            </HStack>

            {videos.length === 0 ? (
              <EmptyState
                title="No videos yet"
                description="Generate your first video in the Explore page to see it here."
                colorScheme="purple"
                icon={LuVideo}
                actions={
                  <Button
                    colorScheme="purple"
                    variant="solid"
                    onClick={() => window.location.href = '/'}
                  >
                    Go to Explore
                  </Button>
                }
              />
            ) : (
              <Wrap 
                spacing={{ base: 3, sm: 4, md: 6 }}
                justify={{ base: 'center', sm: 'flex-start' }}
                mx={{ base: -2, sm: 0 }}
              >
                {videos.map((video) => (
                  <WrapItem key={video.id}>
                    <Box
                      bg={cardBg}
                      borderRadius="xl"
                      overflow="hidden"
                      position="relative"
                      width={{ 
                        base: "280px", 
                        sm: "320px", 
                        md: "360px" 
                      }}
                      boxShadow="lg"
                      transition="all 0.2s"
                      _hover={{
                        transform: 'translateY(-2px)',
                        shadow: 'xl',
                      }}
                    >
                      {/* Video Player */}
                      <Box
                        bg="black"
                        position="relative"
                        height="200px"
                        overflow="hidden"
                      >
                        <video
                          src={video.videoUrl}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                          controls
                          preload="metadata"
                        />
                      </Box>

                      {/* Video Info */}
                      <Box p={4}>
                        <VStack spacing={3} align="stretch">
                          {/* Prompt */}
                          <Text
                            fontSize="sm"
                            fontWeight="medium"
                            noOfLines={2}
                            color="gray.700"
                            _dark={{ color: 'gray.300' }}
                          >
                            {video.prompt}
                          </Text>

                          {/* Metadata */}
                          <HStack spacing={2} flexWrap="wrap">
                            <Badge colorScheme="green" variant="subtle" size="sm">
                              {video.resolution}
                            </Badge>
                            <Badge colorScheme="blue" variant="subtle" size="sm">
                              {video.duration}s
                            </Badge>
                            <Badge colorScheme="purple" variant="subtle" size="sm">
                              {video.model}
                            </Badge>
                            {video.hasAudio && (
                              <Badge colorScheme="orange" variant="subtle" size="sm">
                                Audio
                              </Badge>
                            )}
                          </HStack>

                          {/* Date */}
                          <HStack spacing={1} color="gray.500" fontSize="xs">
                            <Icon as={LuCalendar} />
                            <Text>{formatDate(video.createdAt)}</Text>
                          </HStack>

                          {/* Actions */}
                          <HStack spacing={2} justify="center">
                            <IconButton
                              aria-label="Play video"
                              icon={<Icon as={LuPlay} />}
                              size="sm"
                              variant="outline"
                              colorScheme="purple"
                              onClick={() => handlePlay(video.videoUrl)}
                            />
                            <IconButton
                              aria-label="Download video"
                              icon={<Icon as={LuDownload} />}
                              size="sm"
                              variant="outline"
                              colorScheme="blue"
                              onClick={() => handleDownload(video.videoUrl, video.prompt)}
                            />
                            <IconButton
                              aria-label="Delete video"
                              icon={<Icon as={LuTrash2} />}
                              size="sm"
                              variant="outline"
                              colorScheme="red"
                              onClick={() => handleDeleteVideo(video.id)}
                            />
                          </HStack>
                        </VStack>
                      </Box>
                    </Box>
                  </WrapItem>
                ))}
              </Wrap>
            )}
          </VStack>
        </Container>
      </PageBody>
    </Page>
  )
} 