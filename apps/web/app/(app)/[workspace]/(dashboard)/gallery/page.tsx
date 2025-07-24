'use client'

import {
  Box,
  Container,
  Text,
  VStack,
  Image,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'
import { Page, PageBody } from '@saas-ui-pro/react'
import { PageHeader } from '#features/common/components/page-header'

const galleryImages = [
  {
    src: '/img/onboarding/video_card.png',
    alt: 'Cat riding a scooter',
  },
  {
    src: '/img/onboarding/gallery_2.png',
    alt: 'Girl with Stitch',
  },
  {
    src: '/img/onboarding/gallery_3.png',
    alt: 'Gallery image 3',
  },
  {
    src: '/img/onboarding/gallery_4.png',
    alt: 'Gallery image 4',
  },
  {
    src: '/img/onboarding/gallery_5.png',
    alt: 'Gallery image 5',
  },
]

export default function GalleryPage() {
  return (
    <Page>
      <PageHeader
        title="Gallery"
      />
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

            <Wrap 
              spacing={{ base: 3, sm: 4, md: 6 }}
              justify={{ base: 'center', sm: 'flex-start' }}
              mx={{ base: -2, sm: 0 }}
            >
              {galleryImages.map((image, index) => (
                <WrapItem key={index}>
                  <Box
                    bg="gray.900"
                    borderRadius="xl"
                    overflow="hidden"
                    position="relative"
                    width={{ 
                      base: "160px", 
                      sm: "180px", 
                      md: "200px" 
                    }}
                    height={{ 
                      base: '240px', 
                      sm: '270px', 
                      md: '300px' 
                    }}
                    transition="all 0.2s"
                    _hover={{
                      transform: 'scale(1.02)',
                      cursor: 'pointer',
                      shadow: 'xl',
                    }}
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width="100%"
                      height="100%"
                      objectFit="cover"
                      loading="lazy"
                      transition="transform 0.2s"
                      _hover={{
                        transform: 'scale(1.05)',
                      }}
                    />
                  </Box>
                </WrapItem>
              ))}
            </Wrap>
          </VStack>
        </Container>
      </PageBody>
    </Page>
  )
} 