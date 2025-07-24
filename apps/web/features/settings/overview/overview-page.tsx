'use client'

import { Button, SimpleGrid } from '@chakra-ui/react'
import { useBilling } from '@saas-ui-pro/billing'
import { Section, SectionBody, SectionHeader } from '@saas-ui-pro/react'
import { Property, PropertyList } from '@saas-ui/react'
import { Card, CardBody, Stack, Heading } from '@chakra-ui/react'
import {
  LuBox,
  LuBriefcase,
  LuCircleHelp,
  LuGithub,
  LuShield,
} from 'react-icons/lu'
import { FiBook, FiCode, FiMap } from 'react-icons/fi'

import { FormattedDate } from '@acme/i18n'
import { LinkButton } from '@acme/ui/button'
import { SettingsPage } from '@acme/ui/settings-page'

import { usePath } from '#features/common/hooks/use-path'

import { SettingsCard } from '../common/settings-card'
import { SupportCard } from '../common/support-card'

export function SettingsOverviewPage() {
  const { currentPlan, isTrialing, isCanceled, trialEndsAt, status } =
    useBilling()

  return (
    <SettingsPage title="Overview" description="Manage your workspace settings">
      <Section>
        <SectionHeader title="Workspace settings" />
        <SectionBody>
          <SimpleGrid columns={[1, null, 2]} spacing={4}>
            <SettingsCard
              title="Billing"
              description="Manage your subscription."
              icon={LuBriefcase}
              footer={
                <LinkButton href={usePath('/settings/plans')} variant="primary">
                  {isCanceled ? 'Activate your account' : 'Upgrade'}
                </LinkButton>
              }
            >
              <PropertyList borderTopWidth="1px" px="4">
                <Property label="Billing plan" value={currentPlan?.name} />
                {isTrialing ? (
                  <Property
                    label="Trial ends"
                    value={<FormattedDate value={trialEndsAt} />}
                  />
                ) : (
                  <Property label="Status" value={status} />
                )}
              </PropertyList>
            </SettingsCard>
          </SimpleGrid>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader title="Your account" />
        <SectionBody>
          <SimpleGrid columns={[1, null, 2]} spacing={4}>
            <SettingsCard
              title="Security recommendations"
              description="Improve your account security by enabling two-factor
              authentication."
              icon={LuShield}
              footer={
                <Button variant="secondary">
                  Enable two-factor authentication
                </Button>
              }
            />
          </SimpleGrid>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader title="More" />
        <SectionBody>
          <SimpleGrid columns={[1, null, 3]} spacing={4}>
            <SupportCard
              title="Start Guide"
              description="Read how to get started with NovaMexi."
              icon={LuCircleHelp}
              href="https://docs.NovaMexi.ai/getting-started"
            />
            <SupportCard
              title="Features"
              description="Explore our Islamic finance features."
              icon={LuBox}
              href="https://docs.NovaMexi.ai/features"
            />
            <SupportCard
              title="Feedback"
              description="Share your feedback and suggestions."
              icon={LuGithub}
              href="https://feedback.NovaMexi.ai"
            />
          </SimpleGrid>
        </SectionBody>
      </Section>

      <Section>
        <SectionHeader title="Documentation" />
        <SectionBody>
          <SimpleGrid columns={1} spacing={4}>
            <Card width="full">
              <CardBody>
                <Stack spacing="4">
                  <Heading size="sm">Documentation</Heading>
                  <Stack direction={{ base: 'column', md: 'row' }} spacing={{ base: '2', md: '4' }} width="full">
                    <LinkButton
                      variant="outline"
                      href="https://docs.NovaMexi.ai/overview"
                      leftIcon={<FiBook />}
                      size={{ base: 'sm', md: 'md' }}
                      width={{ base: 'full', md: 'auto' }}
                    >
                      Documentation
                    </LinkButton>
                    <LinkButton
                      variant="outline"
                      href="https://docs.NovaMexi.ai/api"
                      leftIcon={<FiCode />}
                      size={{ base: 'sm', md: 'md' }}
                      width={{ base: 'full', md: 'auto' }}
                    >
                      API Reference
                    </LinkButton>
                    <LinkButton
                      variant="outline"
                      href="https://roadmap.NovaMexi.ai"
                      leftIcon={<FiMap />}
                      size={{ base: 'sm', md: 'md' }}
                      width={{ base: 'full', md: 'auto' }}
                    >
                      Roadmap
                    </LinkButton>
                  </Stack>
                </Stack>
              </CardBody>
            </Card>
          </SimpleGrid>
        </SectionBody>
      </Section>
    </SettingsPage>
  )
}
