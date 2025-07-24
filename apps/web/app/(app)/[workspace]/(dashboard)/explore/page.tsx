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
} from '@chakra-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { useState } from 'react'

const hints = [
  'A fluffy panda in sunglasses dances on snowy peak',
  'A warrior in black fur cloak faces a massive dragon',
  'A gentleman learns an axolotl-futuristic car',
  'A bunny in 3d cartoon style playing guitar',
]

export default function ExplorePage() {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!prompt) return
    setIsGenerating(true)
    // TODO: Implement video generation logic
    setTimeout(() => {
      setIsGenerating(false)
    }, 2000)
  }

  const cardBg = useColorModeValue('white', 'gray.800')
  const hintBg = useColorModeValue('purple.50', 'whiteAlpha.100')

  return (
    <Page>
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
                spacing={4} 
                align="stretch"
                direction={{ base: 'column', md: 'column' }}
              >
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
                <Box textAlign={{ base: "center", md: "right" }}>
                  <Button
                    colorScheme="purple"
                    size={{ base: "md", md: "lg" }}
                    isLoading={isGenerating}
                    loadingText="Creating Video..."
                    onClick={handleGenerate}
                    px={{ base: 6, md: 8 }}
                    w={{ base: 'full', md: 'auto' }}
                  >
                    Create Video
                  </Button>
                </Box>
              </Stack>
            </Card>

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
                    _hover={{ bg: useColorModeValue('purple.100', 'whiteAlpha.200') }}
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