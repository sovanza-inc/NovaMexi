'use client'

import { Box, Heading, Text, SimpleGrid, HStack, Card, CardBody, Select, Spinner, Button, useToast, Image, VStack, IconButton, ButtonGroup, Tooltip } from '@chakra-ui/react'
import { PageHeader } from '#features/common/components/page-header'
import { useCurrentWorkspace } from '#features/common/hooks/use-current-workspace'
import { useApiCache } from '#features/common/hooks/use-api-cache'
import React, { useRef, useState } from 'react'
import { LuDownload, LuPlus, LuRefreshCw } from 'react-icons/lu'
import jsPDF from 'jspdf'
import { EditablePdfPreview, FilteredBalanceSheetData } from './components/EditablePdfPreview'
import { CustomBalanceSheetStatement } from './types'
import { useModals } from '@saas-ui/react'
import { z } from 'zod'

interface BankAccount {
  id?: string;
  account_id: string;
  status: string;
  status_update_date_time: string | null;
  currency: string;
  account_type?: string;
  account_sub_type?: string;
  nickname?: string;
  opening_date?: string | null;
  account?: Array<{
    scheme_name: string;
    identification: string;
    name: string | null;
  }>;
  bank_id?: string;
  bank_name?: string;
}

interface BankBalance {
  account_id: string;
  balance: number;
  currency: string;
  type: string;
  credit_debit_indicator?: string;
  updated_at: string;
}

interface AccountWithBalance extends BankAccount {
  balance?: BankBalance;
}

interface BankWithAccounts {
  id: string;
  name: string;
  bank_identifier?: string;
  accounts: AccountWithBalance[];
}

interface Transaction {
  transaction_id: string;
  account_id: string;
  transaction_information: string;
  amount: {
    amount: number;
    currency: string;
  };
  credit_debit_indicator: string;
  status: string;
  booking_date_time: string;
  bank_name?: string;
}

export default function BalanceSheetPage() {
  const [workspace] = useCurrentWorkspace()
  const { CACHE_KEYS, prefetchData } = useApiCache()
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [customerId, setCustomerId] = useState<string | null>(null)
  const [bankAccounts, setBankAccounts] = useState<BankWithAccounts[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLImageElement>(null)
  const toast = useToast()
  const [customStatements, setCustomStatements] = useState<CustomBalanceSheetStatement[]>([])
  const modals = useModals()

  // Initialize auth token and customer ID
  React.useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get auth token
        const authResponse = await fetch('/api/bank-integration/auth', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!authResponse.ok) {
          throw new Error('Failed to authenticate');
        }
        
        const authData = await authResponse.json();
        setAuthToken(authData.access_token);

        // Check if customer exists
        const customerCheckResponse = await fetch(`/api/bank-integration/get-customer?app_user_id=${workspace.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${authData.access_token}`
          }
        });

        if (customerCheckResponse.ok) {
          const customerData = await customerCheckResponse.json();
          setCustomerId(customerData.customer_id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      }
    }

    if (workspace?.id) {
      initializeAuth()
    }
  }, [workspace?.id])

  // Fetch connected banks and their accounts
  const fetchConnectedBanks = React.useCallback(async () => {
    if (!customerId || !authToken) return []

    try {
      // Create a unique cache key that includes the customer ID
      const cacheKey = `${CACHE_KEYS.ACCOUNTS}_${customerId}`
      const cachedData = await prefetchData(
        cacheKey,
        async () => {
          const response = await fetch(`/api/bank-integration/accounts?customer_id=${customerId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          })

          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.details || 'Failed to fetch connected banks')
          }

          return data
        }
      )

      return cachedData
    } catch (error) {
      console.error('Error fetching connected banks:', error)
      return []
    }
  }, [customerId, authToken, prefetchData, CACHE_KEYS.ACCOUNTS])

  // Fetch accounts for each bank
  const fetchAccountsForBank = React.useCallback(async (entityId: string) => {
    try {
      // Create a unique cache key that includes both customer ID and entity ID
      const cacheKey = `${CACHE_KEYS.ACCOUNTS}_${customerId}_${entityId}`
      return await prefetchData(
        cacheKey,
        async () => {
          const response = await fetch(`/api/bank-integration/fetch-accounts?entity_id=${entityId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          })

          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.details || 'Failed to fetch bank accounts')
          }

          return data
        }
      )
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
      return []
    }
  }, [authToken, customerId, prefetchData, CACHE_KEYS.ACCOUNTS])

  // Fetch balance for an account
  const fetchBalanceForAccount = React.useCallback(async (accountId: string, entityId: string) => {
    try {
      // Create a unique cache key that includes customer ID, account ID, and entity ID
      const cacheKey = `${CACHE_KEYS.ACCOUNTS}_balance_${customerId}_${accountId}_${entityId}`
      return await prefetchData(
        cacheKey,
        async () => {
          const response = await fetch(`/api/bank-integration/balance?account_id=${accountId}&entity_id=${entityId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          })

          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.details || 'Failed to fetch balance')
          }

          return data
        }
      )
    } catch (error) {
      console.error('Error fetching balance:', error)
      return null
    }
  }, [authToken, customerId, prefetchData, CACHE_KEYS.ACCOUNTS])

  // Fetch transactions for an account
  const fetchTransactionsForAccount = React.useCallback(async (accountId: string, entityId: string) => {
    try {
      // Create a unique cache key that includes customer ID, account ID, and entity ID
      const cacheKey = `${CACHE_KEYS.TRANSACTIONS}_${customerId}_${accountId}_${entityId}`
      return await prefetchData(
        cacheKey,
        async () => {
          const response = await fetch(`/api/bank-integration/transactions?account_id=${accountId}&entity_id=${entityId}`, {
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          })

          const data = await response.json()
          
          if (!response.ok) {
            throw new Error(data.details || 'Failed to fetch transactions')
          }

          return data.transactions || []
        }
      )
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return []
    }
  }, [authToken, customerId, prefetchData, CACHE_KEYS.TRANSACTIONS])

  // Fetch all data function
  const fetchAllData = React.useCallback(async () => {
    if (!customerId || !authToken) return;

    setIsLoading(true);
    try {
      const connectedBanks = await fetchConnectedBanks();
      console.log('Connected Banks Response:', connectedBanks);
      
      const banksWithAccounts: BankWithAccounts[] = [];
      let allTransactions: Transaction[] = [];
      
      for (const bank of connectedBanks) {
        const accounts = await fetchAccountsForBank(bank.id);
        console.log(`Accounts for bank ${bank.name}:`, accounts);
        
        const accountsWithBalances: AccountWithBalance[] = [];
        
        for (const account of accounts) {
          const balance = await fetchBalanceForAccount(account.account_id, bank.id);
          console.log(`Balance for account ${account.account_id}:`, balance);
          
          accountsWithBalances.push({
            ...account,
            balance,
            bank_id: bank.id,
            bank_name: bank.bank_identifier || bank.name
          });

          const accountTransactions = await fetchTransactionsForAccount(account.account_id, bank.id);
          allTransactions = [...allTransactions, ...accountTransactions.map((t: any) => ({
            ...t,
            bank_name: bank.bank_identifier || bank.name
          }))];
        }

        if (accountsWithBalances.length > 0) {
          banksWithAccounts.push({
            id: bank.id,
            name: bank.bank_identifier || bank.name,
            accounts: accountsWithBalances
          });
        }
      }

      // Sort transactions by date (most recent first)
      allTransactions.sort((a, b) => 
        new Date(b.booking_date_time).getTime() - new Date(a.booking_date_time).getTime()
      );

      setBankAccounts(banksWithAccounts);
      setTransactions(allTransactions);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to fetch balance sheet data');
    } finally {
      setIsLoading(false);
    }
  }, [customerId, authToken, fetchConnectedBanks, fetchAccountsForBank, fetchBalanceForAccount, fetchTransactionsForAccount]);

  // Fetch all data on mount
  React.useEffect(() => {
    if (customerId && authToken) {
      fetchAllData();
    }
  }, [customerId, authToken, fetchAllData]);

  // Filter transactions based on selected account
  const filteredTransactions = React.useMemo(() => {
    if (selectedAccount === 'all') {
      // For "All Banks", ensure we show transactions from multiple banks with diverse amounts and account types
      // First, group transactions by bank
      const bankTransactionMap = new Map<string, Transaction[]>();
      
      // Group transactions by bank ID
      transactions.forEach(transaction => {
        const bank = bankAccounts.find(b => b.accounts.some(a => a.account_id === transaction.account_id));
        if (!bank) return;
        
        if (!bankTransactionMap.has(bank.id)) {
          bankTransactionMap.set(bank.id, []);
        }
        
        bankTransactionMap.get(bank.id)?.push({
          ...transaction,
          bank_name: bank.name
        });
      });
      
      // If we have banks with transactions
      if (bankTransactionMap.size > 0) {
        const result: Transaction[] = [];
        
        // Process each bank separately
        bankTransactionMap.forEach((bankTransactions, bankId) => {
          const bank = bankAccounts.find(b => b.id === bankId);
          if (!bank) return;
          
          // Group transactions by account type
          const accountTransactionMap = new Map<string, Transaction[]>();
          
          bankTransactions.forEach(transaction => {
            const account = bank.accounts.find(a => a.account_id === transaction.account_id);
            if (!account) return;
            
            const accountType = account.account_type?.toLowerCase() || account.nickname?.toLowerCase() || 'other';
            if (!accountTransactionMap.has(accountType)) {
              accountTransactionMap.set(accountType, []);
            }
            
            accountTransactionMap.get(accountType)?.push(transaction);
          });
          
          // Process each account type - select multiple transactions per account type
          accountTransactionMap.forEach((accountTxns) => {
            const credits = accountTxns.filter(t => t.credit_debit_indicator === 'CREDIT');
            const debits = accountTxns.filter(t => t.credit_debit_indicator === 'DEBIT');
            
            // Take multiple credit transactions
            if (credits.length > 0) {
              // Sort by amount (highest first)
              const sortedCredits = [...credits].sort((a, b) => b.amount.amount - a.amount.amount);
              // Take up to 2 highest credit transactions
              result.push(...sortedCredits.slice(0, 2));
            }
            
            // Take multiple debit transactions
            if (debits.length > 0) {
              // Sort by amount (highest first)
              const sortedDebits = [...debits].sort((a, b) => b.amount.amount - a.amount.amount);
              // Take up to 2 highest debit transactions
              result.push(...sortedDebits.slice(0, 2));
            }
          });
        });
        
        // Sort by date (most recent first) and limit to 10 transactions
        result.sort((a, b) => 
          new Date(b.booking_date_time).getTime() - new Date(a.booking_date_time).getTime()
        );
        
        return result.slice(0, 10);
      }
      
      // Fallback to most recent 10 transactions if grouping fails
      return transactions.slice(0, 10);
    } else {
      // For specific bank selection
      const bankTransactions = transactions.filter(t => {
        const bank = bankAccounts.find(b => b.id === selectedAccount);
        return bank?.accounts.some(a => a.account_id === t.account_id);
      });
      
      // Group by account type
      const accountTypeGroups = new Map<string, Transaction[]>();
      
      bankTransactions.forEach(transaction => {
        const bank = bankAccounts.find(b => b.id === selectedAccount);
        const account = bank?.accounts.find(a => a.account_id === transaction.account_id);
        if (!account) return;
        
        const accountType = account.account_type?.toLowerCase() || account.nickname?.toLowerCase() || 'other';
        if (!accountTypeGroups.has(accountType)) {
          accountTypeGroups.set(accountType, []);
        }
        
        accountTypeGroups.get(accountType)?.push(transaction);
      });
      
      const result: Transaction[] = [];
      
      // Process each account type group - select more transactions per group
      accountTypeGroups.forEach((groupTxns) => {
        const credits = groupTxns.filter(t => t.credit_debit_indicator === 'CREDIT');
        const debits = groupTxns.filter(t => t.credit_debit_indicator === 'DEBIT');
        
        // Take multiple credit transactions
        if (credits.length > 0) {
          // Sort by amount (highest first)
          const sortedCredits = [...credits].sort((a, b) => b.amount.amount - a.amount.amount);
          // Take up to 3 highest credit transactions
          result.push(...sortedCredits.slice(0, 3));
        }
        
        // Take multiple debit transactions
        if (debits.length > 0) {
          // Sort by amount (highest first)
          const sortedDebits = [...debits].sort((a, b) => b.amount.amount - a.amount.amount);
          // Take up to 3 highest debit transactions
          result.push(...sortedDebits.slice(0, 3));
        }
      });
      
      // Sort by date (most recent first) and limit to 10 transactions
      result.sort((a, b) => 
        new Date(b.booking_date_time).getTime() - new Date(a.booking_date_time).getTime()
      );
      
      return result.slice(0, 10);
    }
  }, [transactions, selectedAccount, bankAccounts])

  // Process data for the editable PDF preview
  const processDataForPreview = () => {
    const formatCurrency = (amount: number) => {
      return `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const totalCash = calculateCashAndEquivalents();

    // Map transactions with all required fields
    const mapTransactions = (t: Transaction) => ({
      date: new Date(t.booking_date_time).toLocaleDateString(),
      accountName: t.account_id,
      description: t.transaction_information,
      amount: t.amount.amount.toString(),
      bankId: '',
      bankName: t.bank_name || ''
    });

    // Calculate current assets using actual functions
    const currentAssets = {
      cash: formatCurrency(totalCash * 0.3), // 30% of total cash
      bank: formatCurrency(totalCash * 0.4), // 40% of total cash
      savings: formatCurrency(totalCash * 0.3), // 30% of total cash
      totalCurrent: formatCurrency(calculateCurrentAssets()),
      transactions: transactions
        .filter(t => t.credit_debit_indicator === 'CREDIT')
        .map(mapTransactions)
    };

    // Calculate non-current assets using actual functions
    const nonCurrentAssets = {
      fixedAssets: formatCurrency(calculatePPE()),
      investments: formatCurrency(calculateRightOfUseAssets()),
      totalNonCurrent: formatCurrency(calculateNonCurrentAssets()),
      transactions: [] as Array<{
        date: string;
        accountName: string;
        description: string;
        amount: string;
        bankId: string;
        bankName: string;
      }>
    };

    // Calculate total assets
    const totalAssets = formatCurrency(calculateCurrentAssets() + calculateNonCurrentAssets());

    // Calculate current liabilities using actual functions
    const currentLiabilities = {
      accountsPayable: formatCurrency(calculateAccountsPayable()),
      shortTermLoans: formatCurrency(calculateShortTermLoans()),
      totalCurrent: formatCurrency(calculateCurrentLiabilities()),
      transactions: transactions
        .filter(t => t.credit_debit_indicator === 'DEBIT')
        .map(mapTransactions)
    };

    // Calculate non-current liabilities using actual functions
    const nonCurrentLiabilities = {
      longTermLoans: formatCurrency(calculateLongTermLoans()),
      totalNonCurrent: formatCurrency(calculateNonCurrentLiabilities()),
      transactions: [] as Array<{
        date: string;
        accountName: string;
        description: string;
        amount: string;
        bankId: string;
        bankName: string;
      }>
    };

    // Calculate total liabilities
    const totalLiabilities = formatCurrency(calculateCurrentLiabilities() + calculateNonCurrentLiabilities());

    // Calculate equity using actual functions
    const equity = {
      ownerEquity: formatCurrency(calculateOwnersCapital()),
      retainedEarnings: formatCurrency(calculateRetainedEarnings()),
      totalEquity: formatCurrency(calculateTotalEquity())
    };

    return {
      assets: {
        currentAssets,
        nonCurrentAssets,
        totalAssets
      },
      liabilities: {
        currentLiabilities,
        nonCurrentLiabilities,
        totalLiabilities
      },
      equity
    };
  };

  const handleExportPDF = async (filteredData: FilteredBalanceSheetData) => {
    if (!contentRef.current || !logoRef.current) return;

    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;
      const margin = 20;

      // Helper function to format amounts consistently
      const formatAmount = (amount: number) => {
        const absAmount = Math.abs(amount);
        const formatted = absAmount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
        return amount < 0 ? `(${formatted})` : formatted;
      };

      // Helper function to add header with consistent styling
      const addHeader = async (pageNum: number) => {
        pdf.setPage(pageNum);

        // Add logo on the right
        try {
          const logoCanvas = document.createElement('canvas');
          const logoCtx = logoCanvas.getContext('2d');
          if (logoCtx && logoRef.current) {
            logoCanvas.width = logoRef.current.naturalWidth;
            logoCanvas.height = logoRef.current.naturalHeight;
            logoCtx.drawImage(logoRef.current, 0, 0);
            const logoData = logoCanvas.toDataURL('image/png');
            const logoWidth = 40;
            const aspectRatio = logoRef.current.naturalWidth / logoRef.current.naturalHeight;
            const logoHeight = logoWidth / aspectRatio;
            const logoX = pageWidth - margin - logoWidth;
            pdf.addImage(logoData, 'PNG', logoX, margin - 5, logoWidth, logoHeight);
          }
        } catch (error) {
          console.error('Error adding logo:', error);
        }

        // Add title and date with consistent styling
        pdf.setFontSize(18);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Muhasaba', margin, margin + 5);
        
        pdf.setFontSize(14);
        pdf.text('BALANCE SHEET', margin, margin + 12);
        
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        const periodStart = filteredData.period.startDate;
        const periodEnd = filteredData.period.endDate;
        pdf.text(
          `For the Period ${periodStart.toLocaleString('default', { month: 'long', year: 'numeric' })} to ${periodEnd.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
          margin,
          margin + 18
        );
        
        // Add column headers with consistent styling
        const startY = margin + 30;
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        
        pdf.text('Description', margin, startY);
        pdf.text('Amount', pageWidth - margin, startY, { align: 'right' });
        
        // Consistent header underline
        pdf.setLineWidth(0.2);
        pdf.line(margin, startY + 1, pageWidth - margin, startY + 1);
        
        return startY + 8;
      };

      // Helper function to add section with consistent styling
      const addSection = (title: string, items: any[], startY: number) => {
        let currentY = startY;
        
        // Section title with consistent styling
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.text(title, margin, currentY);
        currentY += 6;
        
        // Items with consistent styling
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        items.forEach(item => {
          const xPos = margin + (item.indent ? 5 : 0);
          
          if (item.isTotal || item.isSubTotal) {
            pdf.setFont('helvetica', 'bold');
          }
          
          // Consistent text alignment
          pdf.text(item.description, xPos, currentY);
          
          const amountText = formatAmount(item.amount);
          pdf.text(amountText, pageWidth - margin, currentY, { align: 'right' });
          
          // Consistent line styling for totals and subtotals
          if (item.isTotal) {
            pdf.setLineWidth(0.2);
            pdf.line(pageWidth - margin - 70, currentY + 1, pageWidth - margin, currentY + 1);
            pdf.line(pageWidth - margin - 70, currentY + 2, pageWidth - margin, currentY + 2);
          } else if (item.isSubTotal) {
            pdf.setLineWidth(0.2);
            pdf.line(pageWidth - margin - 70, currentY + 1, pageWidth - margin, currentY + 1);
          }
          
          pdf.setFont('helvetica', 'normal');
          currentY += 6;
        });
        
        return currentY + 4;
      };

      const startY = await addHeader(1);

      // Process assets data using filtered data
      const currentAssetsItems = [
        { description: 'Current Assets', amount: 0 },
        { description: 'Cash and Cash Equivalents', amount: filteredData.assets.currentAssets.cash, indent: true },
        { description: 'Accounts Receivable', amount: filteredData.assets.currentAssets.bank, indent: true },
        { description: 'Inventory', amount: filteredData.assets.currentAssets.savings, indent: true },
        // Add custom current assets
        ...customStatements
          .filter(statement => statement.type === 'asset' && statement.category === 'current')
          .map(statement => ({
            description: statement.name,
            amount: statement.amount,
            indent: true,
            date: statement.date
          })),
        { 
          description: 'Total Current Assets', 
          amount: filteredData.assets.currentAssets.totalCurrent +
                  customStatements
                    .filter(statement => statement.type === 'asset' && statement.category === 'current')
                    .reduce((total, statement) => total + statement.amount, 0),
          isSubTotal: true 
        }
      ];

      const nonCurrentAssetsItems = [
        { description: 'Non-Current Assets', amount: 0 },
        { description: 'Fixed Assets', amount: filteredData.assets.nonCurrentAssets.fixedAssets, indent: true },
        { description: 'Investments', amount: filteredData.assets.nonCurrentAssets.investments, indent: true },
        // Add custom non-current assets
        ...customStatements
          .filter(statement => statement.type === 'asset' && statement.category === 'non-current')
          .map(statement => ({
            description: statement.name,
            amount: statement.amount,
            indent: true,
            date: statement.date
          })),
        { 
          description: 'Total Non-Current Assets', 
          amount: filteredData.assets.nonCurrentAssets.totalNonCurrent +
                  customStatements
                    .filter(statement => statement.type === 'asset' && statement.category === 'non-current')
                    .reduce((total, statement) => total + statement.amount, 0),
          isSubTotal: true 
        }
      ];

      const totalAssetsItems = [
        { 
          description: 'TOTAL ASSETS', 
          amount: filteredData.assets.totalAssets,
          isTotal: true 
        }
      ];

      let currentY = startY;
      currentY = addSection('ASSETS', currentAssetsItems, currentY);
      currentY = addSection('', nonCurrentAssetsItems, currentY);
      currentY = addSection('', totalAssetsItems, currentY);
      
      // Process liabilities data using filtered data
      const currentLiabilitiesItems = [
        { description: 'Current Liabilities', amount: 0 },
        { description: 'Accounts Payable', amount: filteredData.liabilities.currentLiabilities.accountsPayable, indent: true },
        { description: 'Short-term Loans', amount: filteredData.liabilities.currentLiabilities.shortTermLoans, indent: true },
        // Add custom current liabilities
        ...customStatements
          .filter(statement => statement.type === 'liability' && statement.category === 'current')
          .map(statement => ({
            description: statement.name,
            amount: statement.amount,
            indent: true,
            date: statement.date
          })),
        { 
          description: 'Total Current Liabilities', 
          amount: filteredData.liabilities.currentLiabilities.totalCurrent +
                  customStatements
                    .filter(statement => statement.type === 'liability' && statement.category === 'current')
                    .reduce((total, statement) => total + statement.amount, 0),
          isSubTotal: true 
        }
      ];

      const nonCurrentLiabilitiesItems = [
        { description: 'Non-Current Liabilities', amount: 0 },
        { description: 'Long-term Loans', amount: filteredData.liabilities.nonCurrentLiabilities.longTermLoans, indent: true },
        // Add custom non-current liabilities
        ...customStatements
          .filter(statement => statement.type === 'liability' && statement.category === 'non-current')
          .map(statement => ({
            description: statement.name,
            amount: statement.amount,
            indent: true,
            date: statement.date
          })),
        { 
          description: 'Total Non-Current Liabilities', 
          amount: filteredData.liabilities.nonCurrentLiabilities.totalNonCurrent +
                  customStatements
                    .filter(statement => statement.type === 'liability' && statement.category === 'non-current')
                    .reduce((total, statement) => total + statement.amount, 0),
          isSubTotal: true 
        }
      ];

      const totalLiabilitiesItems = [
        { 
          description: 'TOTAL LIABILITIES', 
          amount: filteredData.liabilities.totalLiabilities,
          isTotal: true 
        }
      ];

      currentY = addSection('LIABILITIES', currentLiabilitiesItems, currentY);
      currentY = addSection('', nonCurrentLiabilitiesItems, currentY);
      currentY = addSection('', totalLiabilitiesItems, currentY);
      
      // Process equity data using filtered data
      const equityItems = [
        { description: "Owner's Equity", amount: filteredData.equity.ownerEquity, indent: true },
        { description: 'Retained Earnings', amount: filteredData.equity.retainedEarnings, indent: true },
        // Add custom equity items
        ...customStatements
          .filter(statement => statement.type === 'equity')
          .map(statement => ({
            description: statement.name,
            amount: statement.amount,
            indent: true,
            date: statement.date
          })),
        { 
          description: 'TOTAL EQUITY', 
          amount: filteredData.equity.totalEquity +
                  customStatements
                    .filter(statement => statement.type === 'equity')
                    .reduce((total, statement) => total + statement.amount, 0),
          isTotal: true 
        }
      ];

      currentY = addSection('EQUITY', equityItems, currentY);

      // Add footer note
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'italic');
      const footerNote = 'The accompanying notes are an integral part of these financial statements.';
      pdf.text(footerNote, margin, Math.min(currentY + 20, pageHeight - margin));

      // Save the PDF
      pdf.save('balance-sheet.pdf');

      toast({
        title: "Export successful",
        description: "Your balance sheet has been downloaded",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Export failed",
        description: "There was an error generating the PDF",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleExportClick = () => {
    setIsPreviewOpen(true);
  };

  // Add calculation functions
  const calculateCashAndEquivalents = () => {
    // Calculate total cash from bank accounts
    return bankAccounts.reduce((total, bank) => {
      if (selectedAccount !== 'all' && bank.id !== selectedAccount) {
        return total;
      }
      return total + bank.accounts.reduce((bankTotal, account) => {
        const balance = account.balance?.balance || 0;
        return bankTotal + (typeof balance === 'string' ? parseFloat(balance) : balance);
      }, 0);
    }, 0);
  };

  const calculateAccountsReceivable = () => {
    // Calculate from unpaid invoices (credit transactions)
    return transactions
      .filter(t => t.credit_debit_indicator === 'CREDIT' && t.status === 'PENDING')
      .reduce((total, t) => total + t.amount.amount, 0);
  };

  const calculateInventory = () => {
    // Get bank data calculation (15% of total assets)
    const totalAssets = calculateCashAndEquivalents() + calculateAccountsReceivable();
    const bankInventory = totalAssets * 0.15; // 15% of total assets

    // Inventory from questionnaire is no longer used
    const questionnaireInventory = 0;

    // Return combined total
    return bankInventory + questionnaireInventory;
  };

  const calculateVATReceivable = () => {
    // Calculate VAT from transactions
    const vatRate = 0.05; // 5% VAT rate
    const totalVATOnPurchases = transactions
      .filter(t => t.credit_debit_indicator === 'DEBIT')
      .reduce((total, t) => total + (t.amount.amount * vatRate), 0);
    
    const totalVATOnSales = transactions
      .filter(t => t.credit_debit_indicator === 'CREDIT')
      .reduce((total, t) => total + (t.amount.amount * vatRate), 0);

    return Math.max(0, totalVATOnPurchases - totalVATOnSales);
  };

  const calculateCurrentAssets = () => {
    const baseCurrentAssets = calculateCashAndEquivalents() + 
                            calculateAccountsReceivable() + 
                            calculateInventory() + 
                            calculateVATReceivable();
    
    // Remove custom statements from here since they are added in the UI
    return baseCurrentAssets;
  };

  const calculatePPE = () => {
    // For now, use a percentage of total assets as PPE
    const totalAssets = calculateCurrentAssets();
    return totalAssets * 0.3; // Assume 30% of total assets is PPE
  };

  const calculateRightOfUseAssets = () => {
    // For now, use a percentage of total assets as Right-of-Use assets
    const totalAssets = calculateCurrentAssets();
    return totalAssets * 0.1; // Assume 10% of total assets is Right-of-Use assets
  };

  const calculateIntangibleAssets = () => {
    // For now, use a percentage of total assets as Intangible assets
    const totalAssets = calculateCurrentAssets();
    return totalAssets * 0.05; // Assume 5% of total assets is Intangible assets
  };

  const calculateNonCurrentAssets = () => {
    const baseNonCurrentAssets = calculatePPE() + calculateRightOfUseAssets() + calculateIntangibleAssets();
    
    // Remove custom statements from here since they are added in the UI
    return baseNonCurrentAssets;
  };

  const calculateOwnersCapital = () => {
    // For now, use initial investment as owner's capital
    const totalAssets = calculateCurrentAssets() + calculateNonCurrentAssets();
    return totalAssets * 0.4; // Assume 40% of total assets is owner's capital
  };

  const calculateRetainedEarnings = () => {
    // Calculate from all historical transactions
    return transactions.reduce((total, t) => {
      const amount = t.amount.amount;
      return total + (t.credit_debit_indicator === 'CREDIT' ? amount : -amount);
    }, 0);
  };

  const calculateTotalEquity = () => {
    const baseEquity = calculateOwnersCapital() + calculateRetainedEarnings();
    
    // Remove custom statements from here since they are added in the UI
    return baseEquity;
  };

  const calculateLongTermLoans = () => {
    // For now, use a percentage of total assets as long-term loans
    const totalAssets = calculateCurrentAssets() + calculateNonCurrentAssets();
    return totalAssets * 0.2; // Assume 20% of total assets is long-term loans
  };

  const calculateNonCurrentLeaseLiabilities = () => {
    // For now, use a percentage of total assets as non-current lease liabilities
    const totalAssets = calculateCurrentAssets() + calculateNonCurrentAssets();
    return totalAssets * 0.1; // Assume 10% of total assets is non-current lease liabilities
  };

  const calculateNonCurrentLiabilities = () => {
    const baseNonCurrentLiabilities = calculateLongTermLoans() + calculateNonCurrentLeaseLiabilities();
    
    // Remove custom statements from here since they are added in the UI
    return baseNonCurrentLiabilities;
  };

  const calculateAccountsPayable = () => {
    // Calculate from unpaid bills (debit transactions)
    return transactions
      .filter(t => t.credit_debit_indicator === 'DEBIT' && t.status === 'PENDING')
      .reduce((total, t) => total + t.amount.amount, 0);
  };

  const calculateShortTermLoans = () => {
    // For now, use a percentage of total assets as short-term loans
    const totalAssets = calculateCurrentAssets() + calculateNonCurrentAssets();
    return totalAssets * 0.15; // Assume 15% of total assets is short-term loans
  };

  const calculateCurrentLeaseLiabilities = () => {
    // For now, use a percentage of total assets as current lease liabilities
    const totalAssets = calculateCurrentAssets() + calculateNonCurrentAssets();
    return totalAssets * 0.05; // Assume 5% of total assets is current lease liabilities
  };

  const calculateVATPayable = () => {
    // Calculate VAT from transactions
    const vatRate = 0.05; // 5% VAT rate
    const totalVATOnSales = transactions
      .filter(t => t.credit_debit_indicator === 'CREDIT')
      .reduce((total, t) => total + (t.amount.amount * vatRate), 0);
    
    const totalVATOnPurchases = transactions
      .filter(t => t.credit_debit_indicator === 'DEBIT')
      .reduce((total, t) => total + (t.amount.amount * vatRate), 0);

    return Math.max(0, totalVATOnSales - totalVATOnPurchases);
  };

  const calculateCurrentLiabilities = () => {
    const baseCurrentLiabilities = calculateAccountsPayable() + 
                                 calculateShortTermLoans() + 
                                 calculateCurrentLeaseLiabilities() + 
                                 calculateVATPayable();
    
    // Remove custom statements from here since they are added in the UI
    return baseCurrentLiabilities;
  };

  // Load custom statements from local storage on mount
  React.useEffect(() => {
    if (workspace?.id) {
      const storageKey = `balanceSheetStatements_${workspace.id}`;
      const savedStatements = localStorage.getItem(storageKey);
      if (savedStatements) {
        try {
          const parsedStatements = JSON.parse(savedStatements);
          setCustomStatements(parsedStatements);
        } catch (error) {
          console.error('Error parsing saved statements:', error);
          localStorage.removeItem(storageKey);
        }
      }
    }
  }, [workspace?.id]);

  // Save custom statements to local storage whenever they change
  React.useEffect(() => {
    if (workspace?.id) {
      const storageKey = `balanceSheetStatements_${workspace.id}`;
      localStorage.setItem(storageKey, JSON.stringify(customStatements));
    }
  }, [customStatements, workspace?.id]);

  // Clear storage on auth token change (indicates login/logout)
  React.useEffect(() => {
    if (!authToken && workspace?.id) {
      const storageKey = `balanceSheetStatements_${workspace.id}`;
      localStorage.removeItem(storageKey);
    }
  }, [authToken, workspace?.id]);

  const handleAddStatement = async (type: 'asset' | 'liability' | 'equity') => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      amount: z.string().min(1, 'Amount is required').transform(val => Number(val)),
      date: z.string().optional(),
      category: z.enum(['current', 'non-current']).default('current'),
      amountType: z.enum(['deposit', 'expense']).default('deposit')
    });

    type FormData = z.infer<typeof schema>;

    const onSubmit = (data: FormData) => {
      const newStatement: CustomBalanceSheetStatement = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        amount: data.amountType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
        date: data.date || new Date().toISOString().split('T')[0],
        type: type === 'liability' ? 
          (data.category === 'current' ? 'liability' : 'liability') : 
          (type === 'asset' ? 'asset' : 'equity'),
        category: type === 'equity' ? 'current' : data.category,
        amountType: data.amountType
      };

      setCustomStatements(prev => [...prev, newStatement]);

      toast({
        title: "Statement added",
        description: `New ${type} statement has been added successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      modals.closeAll();
      return true;
    };

    const categoryField = type === 'equity' ? {} : {
      category: {
        label: 'Category',
        type: 'select',
        options: type === 'liability' ? [
          { label: 'Current Liabilities', value: 'current' },
          { label: 'Non-Current Liabilities', value: 'non-current' }
        ] : [
          { label: 'Current Assets', value: 'current' },
          { label: 'Non-Current Assets', value: 'non-current' }
        ]
      }
    };

    modals.form({
      title: `Add New ${type === 'liability' ? 'Liability' : type.charAt(0).toUpperCase() + type.slice(1)} Statement`,
      schema,
      defaultValues: {
        date: new Date().toISOString().split('T')[0],
        category: 'current'
      },
      onSubmit,
      fields: {
        name: {
          label: 'Statement Name',
          placeholder: type === 'liability' ? 'Enter liability name' : type === 'asset' ? 'Enter asset name' : 'Enter equity name'
        },
        amount: {
          label: 'Amount (AED)',
          type: 'number',
          placeholder: '0.00'
        },
        amountType: {
          label: 'Amount Type',
          type: 'select',
          options: [
            { label: 'Deposit', value: 'deposit' },
            { label: 'Expense', value: 'expense' }
          ]
        },
        date: {
          label: 'Date',
          type: 'date'
        },
        ...categoryField
      }
    });
  };

  const handleAddEquityOrLiability = () => {
    const schema = z.object({
      name: z.string().min(1, 'Name is required'),
      amount: z.string().min(1, 'Amount is required').transform(val => Number(val)),
      date: z.string().optional(),
      section: z.enum(['equity', 'current_liability', 'non_current_liability']),
      amountType: z.enum(['deposit', 'expense']).default('deposit')
    });

    type FormData = z.infer<typeof schema>;

    const onSubmit = (data: FormData) => {
      const newStatement: CustomBalanceSheetStatement = {
        id: Math.random().toString(36).substr(2, 9),
        name: data.name,
        amount: data.amountType === 'expense' ? -Math.abs(data.amount) : Math.abs(data.amount),
        date: data.date || new Date().toISOString().split('T')[0],
        type: data.section === 'equity' ? 'equity' : 'liability',
        category: data.section === 'current_liability' ? 'current' : 'non-current',
        amountType: data.amountType
      };

      setCustomStatements(prev => [...prev, newStatement]);

      toast({
        title: "Statement added",
        description: `New ${data.section.replace('_', ' ')} statement has been added successfully`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      modals.closeAll();
      return true;
    };

    modals.form({
      title: 'Add New Statement',
      schema,
      defaultValues: {
        date: new Date().toISOString().split('T')[0],
        section: 'equity'
      },
      onSubmit,
      fields: {
        section: {
          label: 'Section',
          type: 'select',
          options: [
            { label: 'Equity', value: 'equity' },
            { label: 'Current Liabilities', value: 'current_liability' },
            { label: 'Non-Current Liabilities', value: 'non_current_liability' }
          ]
        },
        name: {
          label: 'Statement Name',
          placeholder: 'Enter statement name'
        },
        amount: {
          label: 'Amount (AED)',
          type: 'number',
          placeholder: '0.00'
        },
        amountType: {
          label: 'Amount Type',
          type: 'select',
          options: [
            { label: 'Deposit', value: 'deposit' },
            { label: 'Expense', value: 'expense' }
          ]
        },
        date: {
          label: 'Date',
          type: 'date'
        }
      }
    });
  };

  const handleRevalidate = async () => {
    try {
      setIsLoading(true);
      toast({
        title: "Revalidating data...",
        status: "info",
        duration: 2000,
        isClosable: true,
      });

      // Inventory from questionnaire is no longer used
      const inventoryFromQuestionnaire = 0;

      // Get inventory value from bank data (using existing calculation)
      const inventoryFromBankData = calculateInventory();

      // Combine both inventory values
      const totalInventory = inventoryFromQuestionnaire + inventoryFromBankData;

      // Update custom statements with combined inventory
      if (totalInventory !== 0) {
        const inventoryStatement: CustomBalanceSheetStatement = {
          id: 'inventory',
          name: 'Inventory',
          amount: totalInventory,
          date: new Date().toISOString().split('T')[0],
          type: 'asset',
          category: 'current',
          amountType: 'deposit'
        };

        setCustomStatements(prev => {
          // Remove any existing inventory statement
          const filtered = prev.filter(s => s.id !== 'inventory');
          return [...filtered, inventoryStatement];
        });
      }

      // Fetch all data
      await fetchAllData();
      
      toast({
        title: "Data revalidated",
        description: "Your balance sheet has been updated with the latest data",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error revalidating data:', error);
      toast({
        title: "Revalidation failed",
        description: "There was an error updating your balance sheet",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <Box p={8}>
        <Text color="red.500">Error loading balance sheet data: {error}</Text>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader />
      <Box p={4}>
        {/* Hidden logo for PDF generation */}
        <Image
          ref={logoRef}
          src="/img/onboarding/muhasaba-logo.png"
          alt="Muhasaba"
          style={{ display: 'none' }}
          crossOrigin="anonymous"
          width="30px"
          height="15px"
        />
        
        <Box 
          height="calc(100vh - 65px)"
          position="relative"
          display="flex"
          flexDirection="column"
          overflowY="auto"
          sx={{
            '&::-webkit-scrollbar': {
              display: 'none'
            },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}
        >
          {/* Reports Section */}
          <Box mb={6}>
            <Box mb={4}>
              <HStack 
                justify="space-between" 
                align="center"
                sx={{
                  '@media screen and (min-width: 321px) and (max-width: 740px)': {
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '1rem'
                  }
                }}
              >
                <Box>
                  <Heading size="lg" mb={2}>Balance Sheet</Heading>
                  <Text color="gray.600" mb={4} fontSize="md">
                    View your company&apos;s financial position with real-time balance sheet data.
                  </Text>
                </Box>
                <ButtonGroup>
                  <Button
                    leftIcon={<LuRefreshCw />}
                    colorScheme="blue"
                    onClick={handleRevalidate}
                    isLoading={isLoading}
                  >
                    Revalidate
                  </Button>
                <Button
                  leftIcon={<LuDownload />}
                  colorScheme="green"
                  onClick={handleExportClick}
                  isLoading={isLoading}
                >
                  Export as PDF
                </Button>
                </ButtonGroup>
              </HStack>
            </Box>

            <Box display="flex" justifyContent="flex-end" mb={4}>
              <Select 
                maxW="200px"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                bg="green.50"
                color="green.500"
                borderColor="green.200"
                _hover={{
                  borderColor: "green.300"
                }}
              >
                <option value="all">All Banks</option>
                {bankAccounts.map((bank) => (
                  <option key={bank.id} value={bank.id}>
                    {bank.name}
                  </option>
                ))}
              </Select>
            </Box>
          </Box>

          <Box ref={contentRef}>
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={8}>
                <Spinner size="xl" />
              </Box>
            ) : (
              <>
                {/* Stats Cards */}
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
                  <Card borderTop="4px solid" borderTopColor="green.400">
                    <CardBody>
                      <Heading size="md" mb={4}>Total Assets</Heading>
                      <SimpleGrid columns={3} gap={4}>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Current:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateCurrentAssets() + 
                            customStatements
                              .filter(statement => statement.type === 'asset' && statement.category === 'current')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Non-Current:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateNonCurrentAssets() + 
                            customStatements
                              .filter(statement => statement.type === 'asset' && statement.category === 'non-current')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Total:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateCurrentAssets() + calculateNonCurrentAssets() + 
                            customStatements
                              .filter(statement => statement.type === 'asset')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                      </SimpleGrid>
                      </CardBody>
                    </Card>

                  <Card borderTop="4px solid" borderTopColor="green.400">
                    <CardBody>
                      <Heading size="md" mb={4}>Total Liabilities & Equity</Heading>
                      <SimpleGrid columns={3} gap={4}>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Current:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateCurrentLiabilities() + 
                            customStatements
                              .filter(statement => statement.type === 'liability' && statement.category === 'current')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Non-Current:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateNonCurrentLiabilities() + 
                            customStatements
                              .filter(statement => statement.type === 'liability' && statement.category === 'non-current')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                        <Box>
                          <Text color="gray.600" fontSize="sm">Equity:</Text>
                          <Text fontSize="md">AED {Math.abs(calculateTotalEquity() + 
                            customStatements
                              .filter(statement => statement.type === 'equity')
                              .reduce((total, statement) => total + statement.amount, 0)
                          ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                        </Box>
                      </SimpleGrid>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Balance Sheet Statement */}
                <Box mb={8}>
                  <Card>
                    <CardBody>
                      <Box textAlign="center" mb={6}>
                        <Heading size="md" mb={2}>Muhasaba</Heading>
                        <Text fontSize="lg" fontWeight="medium">Statement of Financial Position (Balance Sheet)</Text>
                        <Text color="gray.600">As of {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
                        <Text color="gray.600">Currency: AED</Text>
                      </Box>

                      {/* New Balance Sheet Section with Enhanced Styling */}
                            <Box>
                        {/* ASSETS Section */}
                        <Box mb={8} borderRadius="lg" overflow="hidden">
                          <Box bg="green.50" p={4}>
                            <HStack justify="space-between" align="center">
                              <Heading size="md" color="green.700">ASSETS</Heading>
                              <IconButton
                                icon={<LuPlus />}
                                size="sm"
                                colorScheme="green"
                                variant="ghost"
                                aria-label="Add Asset"
                                onClick={() => handleAddStatement('asset')}
                              />
                            </HStack>
                          </Box>
                          
                          {/* Non-Current Assets */}
                          <Box p={4} bg="white" borderBottom="1px" borderColor="gray.100">
                            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">Non-Current Assets</Text>
                            <Box pl={4}>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Text color="gray.600">Property, Plant and Equipment</Text>
                                  <Text fontWeight="medium">AED {calculatePPE().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Right-of-Use Assets</Text>
                                  <Text fontWeight="medium">AED {calculateRightOfUseAssets().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Intangible Assets</Text>
                                  <Text fontWeight="medium">AED {calculateIntangibleAssets().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                {/* Custom Non-Current Asset Statements */}
                                {customStatements
                                  .filter(statement => statement.type === 'asset' && statement.category === 'non-current')
                                  .map(statement => (
                                    <HStack key={statement.id} justify="space-between">
                                      <Text color="gray.600">{statement.name}</Text>
                                      <Text fontWeight="medium">AED {statement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </HStack>
                                  ))}
                                <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
                                  <Text fontWeight="semibold">Total Non-Current Assets</Text>
                                  <Text fontWeight="semibold" color="green.600">
                                    AED {(calculateNonCurrentAssets() + 
                                      customStatements
                                        .filter(statement => statement.type === 'asset' && statement.category === 'non-current')
                                        .reduce((total, statement) => total + statement.amount, 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Box>

                          {/* Current Assets */}
                          <Box p={4} bg="white">
                            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">Current Assets</Text>
                            <Box pl={4}>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Text color="gray.600">Cash and Cash Equivalents</Text>
                                  <Text fontWeight="medium">AED {calculateCashAndEquivalents().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Accounts Receivable</Text>
                                  <Text fontWeight="medium">AED {calculateAccountsReceivable().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                
                                {/* Inventory with Combined Data and Tooltip */}
                                <HStack justify="space-between">
                                  <Tooltip
                                    hasArrow
                                    label={
                                      <VStack align="start" p={2} spacing={2}>
                                        <Text fontWeight="bold">Inventory Breakdown:</Text>
                                        <HStack justify="space-between" width="100%">
                                          <Text>Bank Data (15% of assets):</Text>
                                          <Text>AED {(
                                            (calculateCashAndEquivalents() + calculateAccountsReceivable()) * 0.15
                                          ).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                        </HStack>
                                        <HStack justify="space-between" width="100%">
                                          <Text>Questionnaire Data:</Text>
                                          <Text>AED {(
                                            customStatements.find(s => s.id === 'inventory')?.amount || 0
                                          ).toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                        </HStack>
                                        <Box pt={2} borderTop="1px" borderColor="gray.200" width="100%">
                                          <HStack justify="space-between" width="100%">
                                            <Text fontWeight="bold">Total Inventory:</Text>
                                            <Text fontWeight="bold">AED {calculateInventory()
                                              .toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
                                          </HStack>
                                        </Box>
                                      </VStack>
                                    }
                                    bg="gray.700"
                                    color="white"
                                    placement="right"
                                  >
                                    <HStack>
                                      <Text color="gray.600">Inventory</Text>
                                      <Text fontSize="xs" color="gray.500">(Click for breakdown)</Text>
                                    </HStack>
                                  </Tooltip>
                                  <Text fontWeight="medium">
                                    AED {calculateInventory()
                                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                                
                                <HStack justify="space-between">
                                  <Text color="gray.600">VAT Receivable</Text>
                                  <Text fontWeight="medium">AED {calculateVATReceivable().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                {/* Custom Current Asset Statements */}
                                {customStatements
                                  .filter(statement => statement.type === 'asset' && statement.category === 'current')
                                  .map(statement => (
                                    <HStack key={statement.id} justify="space-between">
                                      <Text color="gray.600">{statement.name}</Text>
                                      <Text fontWeight="medium">AED {statement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </HStack>
                                  ))}
                                <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
                                  <Text fontWeight="semibold">Total Current Assets</Text>
                                  <Text fontWeight="semibold" color="green.600">
                                    AED {(calculateCurrentAssets() + 
                                      customStatements
                                        .filter(statement => statement.type === 'asset' && statement.category === 'current')
                                        .reduce((total, statement) => total + statement.amount, 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Box>

                          {/* Total Assets */}
                          <Box p={4} bg="green.50">
                            <HStack justify="space-between">
                              <Text fontWeight="bold" fontSize="lg" color="green.700">TOTAL ASSETS</Text>
                              <Text fontWeight="bold" fontSize="lg" color="green.700">
                                AED {Math.abs(calculateCurrentAssets() + calculateNonCurrentAssets() + 
                                  customStatements
                                    .filter(statement => statement.type === 'asset')
                                    .reduce((total, statement) => total + statement.amount, 0)
                                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Text>
                            </HStack>
                          </Box>
                        </Box>

                        {/* EQUITY AND LIABILITIES Section */}
                        <Box mb={8} borderRadius="lg" overflow="hidden">
                          <Box bg="blue.50" p={4}>
                            <HStack justify="space-between" align="center">
                              <Heading size="md" color="blue.700">EQUITY AND LIABILITIES</Heading>
                              <IconButton
                                icon={<LuPlus />}
                                size="sm"
                                colorScheme="blue"
                                variant="ghost"
                                aria-label="Add Statement"
                                onClick={() => handleAddEquityOrLiability()}
                              />
                            </HStack>
                          </Box>

                          {/* Equity */}
                          <Box p={4} bg="white" borderBottom="1px" borderColor="gray.100">
                            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">Equity</Text>
                            <Box pl={4}>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Text color="gray.600">Owner&apos;s Capital</Text>
                                  <Text fontWeight="medium">AED {calculateOwnersCapital().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Retained Earnings</Text>
                                  <Text fontWeight="medium">AED {calculateRetainedEarnings().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                {/* Custom Equity Statements */}
                                {customStatements
                                  .filter(statement => statement.type === 'equity')
                                  .map(statement => (
                                    <HStack key={statement.id} justify="space-between">
                                      <Text color="gray.600">{statement.name}</Text>
                                      <Text fontWeight="medium">AED {statement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </HStack>
                                  ))}
                                <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
                                  <Text fontWeight="semibold">Total Equity</Text>
                                  <Text fontWeight="semibold" color="blue.600">
                                    AED {(calculateTotalEquity() + 
                                      customStatements
                                        .filter(statement => statement.type === 'equity')
                                        .reduce((total, statement) => total + statement.amount, 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Box>

                          {/* Non-Current Liabilities */}
                          <Box p={4} bg="white" borderBottom="1px" borderColor="gray.100">
                            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">Non-Current Liabilities</Text>
                            <Box pl={4}>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Text color="gray.600">Long-Term Loans</Text>
                                  <Text fontWeight="medium">AED {calculateLongTermLoans().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Lease Liabilities (Non-Current)</Text>
                                  <Text fontWeight="medium">AED {calculateNonCurrentLeaseLiabilities().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                {/* Custom Non-Current Liability Statements */}
                                {customStatements
                                  .filter(statement => statement.type === 'liability' && statement.category === 'non-current')
                                  .map(statement => (
                                    <HStack key={statement.id} justify="space-between">
                                      <Text color="gray.600">{statement.name}</Text>
                                      <Text fontWeight="medium">AED {statement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </HStack>
                                  ))}
                                <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
                                  <Text fontWeight="semibold">Total Non-Current Liabilities</Text>
                                  <Text fontWeight="semibold" color="blue.600">
                                    AED {(calculateNonCurrentLiabilities() + 
                                      customStatements
                                        .filter(statement => statement.type === 'liability' && statement.category === 'non-current')
                                        .reduce((total, statement) => total + statement.amount, 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Box>

                          {/* Current Liabilities */}
                          <Box p={4} bg="white">
                            <Text fontWeight="bold" fontSize="lg" mb={4} color="gray.700">Current Liabilities</Text>
                            <Box pl={4}>
                              <VStack spacing={3} align="stretch">
                                <HStack justify="space-between">
                                  <Text color="gray.600">Accounts Payable</Text>
                                  <Text fontWeight="medium">AED {calculateAccountsPayable().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Short-Term Loans</Text>
                                  <Text fontWeight="medium">AED {calculateShortTermLoans().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">Lease Liabilities (Current)</Text>
                                  <Text fontWeight="medium">AED {calculateCurrentLeaseLiabilities().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                <HStack justify="space-between">
                                  <Text color="gray.600">VAT Payable</Text>
                                  <Text fontWeight="medium">AED {calculateVATPayable().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                </HStack>
                                {/* Custom Current Liability Statements */}
                                {customStatements
                                  .filter(statement => statement.type === 'liability' && statement.category === 'current')
                                  .map(statement => (
                                    <HStack key={statement.id} justify="space-between">
                                      <Text color="gray.600">{statement.name}</Text>
                                      <Text fontWeight="medium">AED {statement.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
                                    </HStack>
                                  ))}
                                <HStack justify="space-between" pt={2} borderTop="1px" borderColor="gray.100">
                                  <Text fontWeight="semibold">Total Current Liabilities</Text>
                                  <Text fontWeight="semibold" color="blue.600">
                                    AED {(calculateCurrentLiabilities() + 
                                      customStatements
                                        .filter(statement => statement.type === 'liability' && statement.category === 'current')
                                        .reduce((total, statement) => total + statement.amount, 0)
                                    ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </Text>
                                </HStack>
                              </VStack>
                            </Box>
                          </Box>

                          {/* Total Equity and Liabilities */}
                          <Box p={4} bg="blue.50">
                            <HStack justify="space-between">
                              <Text fontWeight="bold" fontSize="lg" color="blue.700">TOTAL EQUITY AND LIABILITIES</Text>
                              <Text fontWeight="bold" fontSize="lg" color="blue.700">
                                AED {Math.abs(
                                  calculateTotalEquity() + 
                                  calculateCurrentLiabilities() + 
                                  calculateNonCurrentLiabilities() +
                                  customStatements
                                    .filter(statement => statement.type === 'equity' || statement.type === 'liability')
                                    .reduce((total, statement) => total + statement.amount, 0)
                                ).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </Text>
                            </HStack>
                          </Box>
                        </Box>
                          </Box>
                        </CardBody>
                      </Card>
                </Box>
              </>
            )}
          </Box>
        </Box>
      </Box>

      <EditablePdfPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onExport={handleExportPDF}
        data={processDataForPreview()}
      />

      {/* Summary Footer */}
      <Box 
        bg="teal.700" 
        color="white" 
        p={4}
        data-summary-footer
        position="sticky"
        bottom={0}
        zIndex={1}
      >
        <HStack justify="space-between">
          <Text>Summary: Assets-Liabilities</Text>
          <Text>Net Worth: {filteredTransactions.reduce((total, transaction) => {
            const amount = transaction.amount.amount;
            return total + (transaction.credit_debit_indicator === 'CREDIT' ? amount : -amount);
          }, 0).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}</Text>
        </HStack>
      </Box>
    </Box>
  );
}
