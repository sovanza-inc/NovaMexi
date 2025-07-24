import {
  Modal,
  ModalOverlay,
  ModalContent,
  Box,
  HStack,
  IconButton,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  ButtonGroup,
  Heading,
  TableContainer,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

interface CashFlowItem {
  description: string;
  note?: string;
  amount2024: number;
  amount2023: number;
  indent?: number;
  isTotal?: boolean;
  isSubTotal?: boolean;
}

export interface FilteredCashFlowData {
  operatingActivities: Array<{
    description: string;
    amount2024: number;
    amount2023: number;
    indent?: number;
    isSubTotal?: boolean;
  }>;
  investingActivities: Array<{
    description: string;
    amount2024: number;
    amount2023: number;
    indent?: number;
    isSubTotal?: boolean;
  }>;
  financingActivities: Array<{
    description: string;
    amount2024: number;
    amount2023: number;
    indent?: number;
    isSubTotal?: boolean;
  }>;
  indirectMethod: {
    netProfit: number;
    adjustments: {
      depreciation: number;
      amortization: number;
      interestExpense: number;
    };
    workingCapital: {
      accountsReceivable: number;
      inventory: number;
      accountsPayable: number;
      vatPayable: number;
    };
  };
  period: {
    startDate: Date;
    endDate: Date;
  };
  openingCashBalance: number;
}

interface EditablePdfPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (filteredData: FilteredCashFlowData) => void;
  data: FilteredCashFlowData;
  logoRef: React.RefObject<HTMLImageElement>;
}

export const EditablePdfPreview: React.FC<EditablePdfPreviewProps> = ({
  isOpen,
  onClose,
  onExport,
  data,
  logoRef
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'3mo' | '6mo' | '12mo'>('6mo');
  const [currentDate, setCurrentDate] = useState(new Date());
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Format date as "MMM DD" (e.g., "May 25")
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const formatAmount = (amount: number) => {
    return `AED ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleExport = async () => {
    if (!contentRef.current || !logoRef.current) return;
    
    // Calculate the date range based on selected period
    const endDate = new Date(currentDate);
    const startDate = new Date(currentDate);
    const periodMonths = selectedPeriod === '3mo' ? 3 : selectedPeriod === '6mo' ? 6 : 12;
    startDate.setMonth(startDate.getMonth() - (periodMonths - 1));
    
    // Set dates to start and end of month
    startDate.setDate(1);
    endDate.setMonth(endDate.getMonth() + 1);
    endDate.setDate(0);

    // Update the period in the data
    const filteredData = {
      ...data,
      period: {
        startDate,
        endDate
      }
    };
    
    onExport(filteredData);
  };

  // Helper functions for calculations
  const calculateOperatingCashFlow = (data: FilteredCashFlowData) => {
    return data.indirectMethod.netProfit +
           data.indirectMethod.adjustments.depreciation +
           data.indirectMethod.adjustments.amortization +
           data.indirectMethod.adjustments.interestExpense +
           data.indirectMethod.workingCapital.accountsReceivable +
           data.indirectMethod.workingCapital.inventory +
           data.indirectMethod.workingCapital.accountsPayable +
           data.indirectMethod.workingCapital.vatPayable;
  };

  const calculateInvestingCashFlow = (data: FilteredCashFlowData) => {
    return data.investingActivities.find(x => x.isSubTotal)?.amount2024 || 0;
  };

  const calculateFinancingCashFlow = (data: FilteredCashFlowData) => {
    return data.financingActivities.find(x => x.isSubTotal)?.amount2024 || 0;
  };

  const calculateDelta = (current: number, previous: number) => {
    if (previous === 0) return current === 0 ? 0 : 100;
    return ((current - previous) / Math.abs(previous)) * 100;
  };

  const renderSection = (title: string, items: CashFlowItem[]) => {
    let totalAmount2024 = 0;
    if (title === 'Operating Activities') {
      totalAmount2024 = calculateOperatingCashFlow(data);
    } else if (title === 'Investing Activities') {
      totalAmount2024 = calculateInvestingCashFlow(data);
    } else if (title === 'Financing Activities') {
      totalAmount2024 = calculateFinancingCashFlow(data);
    }

    return (
      <>
        <Tr>
          <Td 
            py="4" 
            pl="6" 
            fontWeight="semibold" 
            color="gray.700" 
            bg="gray.50"
            colSpan={4}
          >
            {title}
          </Td>
        </Tr>
        {items.map((item, index) => (
          <Tr key={index}>
            <Td 
              py="3" 
              pl={item.indent ? "14" : "6"} 
              color="gray.700"
              fontWeight={item.isSubTotal || item.isTotal ? "semibold" : "normal"}
            >
              {item.description}
            </Td>
            <Td 
              isNumeric 
              py="3"
              fontWeight={item.isSubTotal || item.isTotal ? "semibold" : "normal"}
            >
              {formatAmount(item.amount2024)}
            </Td>
            <Td 
              isNumeric 
              py="3"
              fontWeight={item.isSubTotal || item.isTotal ? "semibold" : "normal"}
            >
              {formatAmount(item.amount2023)}
            </Td>
            <Td 
              isNumeric 
              py="3" 
              pr="6"
              fontWeight={item.isSubTotal || item.isTotal ? "semibold" : "normal"}
            >
              {calculateDelta(item.amount2024, item.amount2023).toFixed(1)}%
            </Td>
          </Tr>
        ))}
        {/* Add total row */}
        <Tr>
          <Td 
            py="3" 
            pl="6" 
            color="gray.700"
            fontWeight="bold"
          >
            Total {title}
          </Td>
          <Td 
            isNumeric 
            py="3"
            fontWeight="bold"
          >
            {formatAmount(totalAmount2024)}
          </Td>
          <Td 
            isNumeric 
            py="3"
            fontWeight="bold"
          >
            {/* For 2023, we'll use the last item's amount2023 if it's a subtotal */}
            {formatAmount(items.find(x => x.isSubTotal)?.amount2023 || 0)}
          </Td>
          <Td 
            isNumeric 
            py="3" 
            pr="6"
            fontWeight="bold"
          >
            {calculateDelta(totalAmount2024, items.find(x => x.isSubTotal)?.amount2023 || 0).toFixed(1)}%
          </Td>
        </Tr>
      </>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay bg="whiteAlpha.800" backdropFilter="blur(2px)" />
      <ModalContent maxW="95vw" mx="4" rounded="lg" overflow="hidden">
        <Box bg="white" px="6" py="4" borderBottom="1px" borderColor="gray.100">
          <HStack justify="space-between">
            <HStack spacing="4">
              <IconButton
                aria-label="Previous month"
                icon={<LuChevronLeft />}
                variant="ghost"
                size="sm"
                onClick={handlePrevMonth}
                color="gray.600"
              />
              <Text fontSize="md" fontWeight="medium" color="gray.700">
                {formatDate(currentDate)}
              </Text>
              <IconButton
                aria-label="Next month"
                icon={<LuChevronRight />}
                variant="ghost"
                size="sm"
                onClick={handleNextMonth}
                color="gray.600"
              />
            </HStack>
            <HStack spacing="2">
              <ButtonGroup size="sm" isAttached variant="outline">
                <Button
                  onClick={() => setSelectedPeriod('3mo')}
                  isActive={selectedPeriod === '3mo'}
                >
                  3mo
                </Button>
                <Button
                  onClick={() => setSelectedPeriod('6mo')}
                  isActive={selectedPeriod === '6mo'}
                >
                  6mo
                </Button>
                <Button
                  onClick={() => setSelectedPeriod('12mo')}
                  isActive={selectedPeriod === '12mo'}
                >
                  12mo
                </Button>
              </ButtonGroup>
              <Button
                colorScheme="blue"
                size="sm"
                onClick={handleExport}
              >
                Export PDF
              </Button>
            </HStack>
          </HStack>
        </Box>

        {/* Content Section */}
        <Box ref={contentRef} p="6" maxH="calc(100vh - 200px)" overflowY="auto">
          {/* Direct Method Table */}
          <Box mb="8">
            <Heading size="md" mb="4">Statement of Cash Flows (Direct Method)</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th 
                      py="4" 
                      pl="6" 
                      color="gray.600" 
                      fontSize="xs" 
                      textTransform="uppercase" 
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="50%"
                    >
                      Description
                    </Th>
                    <Th
                      isNumeric
                      py="4"
                      color="gray.600"
                      fontSize="xs"
                      textTransform="uppercase"
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="20%"
                    >
                      {currentDate.getFullYear()}
                    </Th>
                    <Th
                      isNumeric
                      py="4"
                      color="gray.600"
                      fontSize="xs"
                      textTransform="uppercase"
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="20%"
                    >
                      {currentDate.getFullYear() - 1}
                    </Th>
                    <Th
                      isNumeric
                      py="4"
                      pr="6"
                      color="gray.600"
                      fontSize="xs"
                      textTransform="uppercase"
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="10%"
                    >
                      Δ YoY (%)
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {renderSection('Operating Activities', data.operatingActivities)}
                  {renderSection('Investing Activities', data.investingActivities)}
                  {renderSection('Financing Activities', data.financingActivities)}
                </Tbody>
              </Table>
            </TableContainer>
          </Box>

          {/* Indirect Method Table */}
          <Box>
            <Heading size="md" mb="4">Statement of Cash Flows (Indirect Method)</Heading>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th 
                      py="4" 
                      pl="6" 
                      color="gray.600" 
                      fontSize="xs" 
                      textTransform="uppercase" 
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="70%"
                    >
                      Description
                    </Th>
                    <Th
                      isNumeric
                      py="4"
                      pr="6"
                      color="gray.600"
                      fontSize="xs"
                      textTransform="uppercase"
                      fontWeight="medium"
                      borderBottom="1px"
                      borderColor="gray.200"
                      width="30%"
                    >
                      Amount
                    </Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {/* Operating Activities */}
                  <Tr>
                    <Td colSpan={2} fontWeight="bold" bg="gray.50">CASH FLOWS FROM OPERATING ACTIVITIES</Td>
                  </Tr>
                  <Tr>
                    <Td pl={8}>Net Profit</Td>
                    <Td isNumeric>{formatAmount(data.indirectMethod?.netProfit ?? 0)}</Td>
                  </Tr>
                  
                  {/* Adjustments */}
                  <Tr>
                    <Td pl={8} fontWeight="medium">Adjustments:</Td>
                    <Td></Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Depreciation</Td>
                    <Td isNumeric>{formatAmount(data.indirectMethod?.adjustments?.depreciation ?? 0)}</Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Amortization</Td>
                    <Td isNumeric>{formatAmount(data.indirectMethod?.adjustments?.amortization ?? 0)}</Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Interest Expense</Td>
                    <Td isNumeric>{formatAmount(data.indirectMethod?.adjustments?.interestExpense ?? 0)}</Td>
                  </Tr>

                  {/* Working Capital Changes */}
                  <Tr>
                    <Td pl={8} fontWeight="medium">Working Capital Changes:</Td>
                    <Td></Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Accounts Receivable</Td>
                    <Td isNumeric color={(data.indirectMethod?.workingCapital?.accountsReceivable ?? 0) < 0 ? "green.500" : "red.500"}>
                      {formatAmount(data.indirectMethod?.workingCapital?.accountsReceivable ?? 0)}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Inventory</Td>
                    <Td isNumeric color={(data.indirectMethod?.workingCapital?.inventory ?? 0) < 0 ? "green.500" : "red.500"}>
                      {formatAmount(data.indirectMethod?.workingCapital?.inventory ?? 0)}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>Accounts Payable</Td>
                    <Td isNumeric color={(data.indirectMethod?.workingCapital?.accountsPayable ?? 0) > 0 ? "green.500" : "red.500"}>
                      {formatAmount(data.indirectMethod?.workingCapital?.accountsPayable ?? 0)}
                    </Td>
                  </Tr>
                  <Tr>
                    <Td pl={12}>VAT Payable/Receivable</Td>
                    <Td isNumeric color={(data.indirectMethod?.workingCapital?.vatPayable ?? 0) > 0 ? "green.500" : "red.500"}>
                      {formatAmount(data.indirectMethod?.workingCapital?.vatPayable ?? 0)}
                    </Td>
                  </Tr>
                  
                  {/* Operating Activities Total */}
                  <Tr fontWeight="bold" bg="gray.50">
                    <Td pl={8}>Net Cash from Operating Activities</Td>
                    <Td isNumeric>
                      {formatAmount(
                        (data.indirectMethod?.netProfit ?? 0) +
                        (data.indirectMethod?.adjustments?.depreciation ?? 0) +
                        (data.indirectMethod?.adjustments?.amortization ?? 0) +
                        (data.indirectMethod?.adjustments?.interestExpense ?? 0) +
                        (data.indirectMethod?.workingCapital?.accountsReceivable ?? 0) +
                        (data.indirectMethod?.workingCapital?.inventory ?? 0) +
                        (data.indirectMethod?.workingCapital?.accountsPayable ?? 0) +
                        (data.indirectMethod?.workingCapital?.vatPayable ?? 0)
                      )}
                    </Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableContainer>
          </Box>
        </Box>

        {/* Footer */}
        <Box p="4" borderTop="1px" borderColor="gray.100">
          <Text color="gray.600" fontSize="sm">Don&apos;t forget to review before exporting</Text>
        </Box>
      </ModalContent>
    </Modal>
  );
};
