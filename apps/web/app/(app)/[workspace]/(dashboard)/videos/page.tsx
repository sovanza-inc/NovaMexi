'use client'

import {
  Box,
  Button,
  Container,
  Text,
  VStack,
  Textarea,
  HStack,
  Image,
  ButtonGroup,
  Flex,
  Icon,
  Center,
  Stack,
} from '@chakra-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { useState } from 'react'
import { LuDownload } from 'react-icons/lu'
import { FaCoins } from 'react-icons/fa6'

const resolutionOptions = [
  { label: '480p', value: '480p' },
  { label: '720p', value: '720p' },
  { label: '1080p', value: '1080p' },
]

type DurationOption = {
  label: string;
  value: number | 'custom';
}

const durationOptions: DurationOption[] = [
  { label: '10 s', value: 10 },
  { label: '20 s', value: 20 },
  { label: '30 s', value: 30 },
  { label: 'Custom', value: 'custom' },
]

export default function VideoPage() {
  const [prompt, setPrompt] = useState('')
  const [selectedResolution, setSelectedResolution] = useState('720p')
  const [selectedDuration, setSelectedDuration] = useState<number | 'custom'>(10)
  const [isGenerating, setIsGenerating] = useState(false)

  const boxBg = 'gray.900'
  const optionsBg = '#2A1E43'
  const buttonBg = 'whiteAlpha.100'
  const buttonActiveBg = 'purple.500'
  const buttonActiveColor = 'white'
  const buttonColor = 'gray.100'

  const handleGenerate = async () => {
    if (!prompt) return
    setIsGenerating(true)
    // TODO: Implement video generation logic
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <Page>
      <PageBody>
        <Container maxW="container.xl" py={{ base: 4, md: 8 }} px={{ base: 4, md: 8 }}>
          <VStack spacing={{ base: 4, md: 6 }} align="stretch">
            <Text 
              fontSize={{ base: "xl", md: "2xl" }} 
              color="white" 
              mb={{ base: 1, md: 2 }}
              textAlign={{ base: 'center', md: 'left' }}
            >
              Transform{' '}
              <Text 
                as="span" 
                color="purple.400"
                display={{ base: 'block', md: 'inline' }}
              >
                Ideas to Visual
              </Text>
            </Text>

            <Flex gap={{ base: 4, md: 6 }} direction={{ base: 'column', lg: 'row' }}>
              {/* Left Box - Input */}
              <Box 
                flex="1" 
                bg={boxBg} 
                borderRadius="xl" 
                p={{ base: 4, md: 6 }}
                height={{ base: "150px", md: "200px" }}
              >
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="riding a motorbike at a leisurely pace while his mouth is seen singing[Truck right,Tracking shot]"
                  size="lg"
                  height="100%"
                  resize="none"
                  bg="transparent"
                  border="none"
                  fontSize={{ base: "sm", md: "md" }}
                  color="gray.300"
                  _focusVisible={{
                    border: 'none',
                    outline: 'none',
                  }}
                  _focus={{
                    border: 'none',
                    outline: 'none',
                  }}
                  _hover={{
                    border: 'none',
                  }}
                />
              </Box>

              {/* Right Column */}
              <Flex direction="column" flex="1" gap={{ base: 3, md: 4 }}>
                {/* Preview Box */}
                <Box 
                  bg={boxBg} 
                  borderRadius="xl"
                  overflow="hidden"
                  height={{ base: "150px", md: "200px" }}
                >
                  <Image
                    src="/img/onboarding/video_card.png"
                    alt="Video preview"
                    width="100%"
                    height="100%"
                    objectFit="contain"
                  />
                </Box>

                {/* Download Button */}
                <Button
                  leftIcon={<LuDownload />}
                  variant="solid"
                  colorScheme="purple"
                  size={{ base: "md", md: "lg" }}
                  mx="auto"
                  px={{ base: 6, md: 8 }}
                >
                  Download
                </Button>
              </Flex>
            </Flex>

            {/* Bottom Controls */}
            <Stack 
              direction={{ base: 'column', md: 'row' }} 
              spacing={{ base: 4, md: 6 }} 
              justify="space-between" 
              align={{ base: 'stretch', md: 'center' }}
            >
              {/* Resolution Options */}
              <Box 
                bg={optionsBg} 
                borderRadius="xl" 
                p={{ base: 3, md: 4 }}
                width={{ base: '100%', md: 'auto' }}
              >
                <Text 
                  color="gray.400" 
                  mb={3}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  Resolution
                </Text>
                <ButtonGroup 
                  isAttached 
                  variant="outline" 
                  size={{ base: "sm", md: "sm" }}
                  width={{ base: '100%', md: 'auto' }}
                >
                  {resolutionOptions.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => setSelectedResolution(option.value)}
                      bg={selectedResolution === option.value ? buttonActiveBg : buttonBg}
                      color={selectedResolution === option.value ? buttonActiveColor : buttonColor}
                      _hover={{
                        bg: selectedResolution === option.value ? buttonActiveBg : 'whiteAlpha.200',
                      }}
                      borderColor="transparent"
                      minW={{ base: '0', md: '80px' }}
                      flex={{ base: 1, md: 'initial' }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              {/* Duration Options */}
              <Box 
                bg={optionsBg} 
                borderRadius="xl" 
                p={{ base: 3, md: 4 }}
                width={{ base: '100%', md: 'auto' }}
              >
                <Text 
                  color="gray.400" 
                  mb={3}
                  fontSize={{ base: "sm", md: "md" }}
                >
                  Duration
                </Text>
                <ButtonGroup 
                  isAttached 
                  variant="outline" 
                  size={{ base: "sm", md: "sm" }}
                  width={{ base: '100%', md: 'auto' }}
                >
                  {durationOptions.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => setSelectedDuration(option.value)}
                      bg={selectedDuration === option.value ? buttonActiveBg : buttonBg}
                      color={selectedDuration === option.value ? buttonActiveColor : buttonColor}
                      _hover={{
                        bg: selectedDuration === option.value ? buttonActiveBg : 'whiteAlpha.200',
                      }}
                      borderColor="transparent"
                      minW={{ base: '0', md: '80px' }}
                      flex={{ base: 1, md: 'initial' }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              {/* Credits */}
              <HStack 
                bg={optionsBg} 
                borderRadius="xl" 
                p={{ base: 3, md: 4 }}
                spacing={3}
                minW={{ base: '100%', md: '150px' }}
                justify={{ base: 'center', md: 'flex-start' }}
              >
                <Icon as={FaCoins} color="yellow.400" boxSize={{ base: 4, md: 5 }} />
                <Text 
                  color="white" 
                  fontWeight="medium"
                  fontSize={{ base: "sm", md: "md" }}
                >
                  100 Credits
                </Text>
              </HStack>
            </Stack>

            {/* Create Video Button Row */}
            <Center pt={{ base: 2, md: 4 }}>
              <Button
                colorScheme="purple"
                size={{ base: "md", md: "lg" }}
                isLoading={isGenerating}
                loadingText="Creating Video..."
                onClick={handleGenerate}
                px={{ base: 8, md: 12 }}
                width={{ base: '100%', md: 'auto' }}
              >
                Create Video
              </Button>
            </Center>
          </VStack>
        </Container>
      </PageBody>
    </Page>
  )
} 