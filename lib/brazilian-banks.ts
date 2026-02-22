export interface BrazilianBank {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  shortName: string;
  type: 'digital' | 'traditional';
  color: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  icon: string; // Emoji or initial
  description: string;
}

export const BRAZILIAN_BANKS: BrazilianBank[] = [
  {
    id: '1',
    name: 'Nubank',
    slug: 'nubank',
    displayName: 'Nubank',
    shortName: 'Nu',
    type: 'digital',
    color: {
      primary: '#820AD1',
      secondary: '#A855F7',
      gradient: 'from-purple-600 to-purple-400'
    },
    icon: '💜',
    description: 'Banco digital líder em inovação'
  },
  {
    id: '2',
    name: 'Itaú Unibanco',
    slug: 'itau',
    displayName: 'Itaú Unibanco',
    shortName: 'Itaú',
    type: 'traditional',
    color: {
      primary: '#EC7000',
      secondary: '#F97316',
      gradient: 'from-orange-600 to-orange-400'
    },
    icon: '🟠',
    description: 'Maior banco privado do Brasil'
  },
  {
    id: '3',
    name: 'Banco do Brasil',
    slug: 'bb',
    displayName: 'Banco do Brasil',
    shortName: 'BB',
    type: 'traditional',
    color: {
      primary: '#FCD303',
      secondary: '#FBBF24',
      gradient: 'from-yellow-500 to-yellow-300'
    },
    icon: '🟡',
    description: 'Maior banco público brasileiro'
  },
  {
    id: '4',
    name: 'Bradesco',
    slug: 'bradesco',
    displayName: 'Bradesco',
    shortName: 'Bradesco',
    type: 'traditional',
    color: {
      primary: '#CC092F',
      secondary: '#DC2626',
      gradient: 'from-red-600 to-red-400'
    },
    icon: '🔴',
    description: 'Tradicional banco brasileiro'
  },
  {
    id: '5',
    name: 'Caixa Econômica Federal',
    slug: 'caixa',
    displayName: 'Caixa Econômica',
    shortName: 'Caixa',
    type: 'traditional',
    color: {
      primary: '#0E4C92',
      secondary: '#2563EB',
      gradient: 'from-blue-700 to-blue-500'
    },
    icon: '🔵',
    description: 'Banco público federal'
  },
  {
    id: '6',
    name: 'Santander',
    slug: 'santander',
    displayName: 'Santander',
    shortName: 'Santander',
    type: 'traditional',
    color: {
      primary: '#EC0000',
      secondary: '#EF4444',
      gradient: 'from-red-600 to-red-400'
    },
    icon: '🔴',
    description: 'Banco espanhol com forte presença no Brasil'
  },
  {
    id: '7',
    name: 'Inter',
    slug: 'inter',
    displayName: 'Banco Inter',
    shortName: 'Inter',
    type: 'digital',
    color: {
      primary: '#FF7A00',
      secondary: '#FB923C',
      gradient: 'from-orange-500 to-orange-300'
    },
    icon: '🟠',
    description: 'Banco digital completo'
  },
  {
    id: '8',
    name: 'C6 Bank',
    slug: 'c6',
    displayName: 'C6 Bank',
    shortName: 'C6',
    type: 'digital',
    color: {
      primary: '#000000',
      secondary: '#1F2937',
      gradient: 'from-gray-900 to-gray-700'
    },
    icon: '⚫',
    description: 'Banco digital do grupo BTG Pactual'
  },
  {
    id: '9',
    name: 'BTG Pactual',
    slug: 'btg',
    displayName: 'BTG Pactual',
    shortName: 'BTG',
    type: 'traditional',
    color: {
      primary: '#0A2240',
      secondary: '#1E3A8A',
      gradient: 'from-blue-900 to-blue-700'
    },
    icon: '🔷',
    description: 'Maior banco de investimentos da América Latina'
  },
  {
    id: '10',
    name: 'PagBank',
    slug: 'pagbank',
    displayName: 'PagBank',
    shortName: 'PagBank',
    type: 'digital',
    color: {
      primary: '#0DB05B',
      secondary: '#10B981',
      gradient: 'from-green-600 to-green-400'
    },
    icon: '🟢',
    description: 'Banco digital do PagSeguro'
  },
  {
    id: '11',
    name: 'Safra',
    slug: 'safra',
    displayName: 'Banco Safra',
    shortName: 'Safra',
    type: 'traditional',
    color: {
      primary: '#003366',
      secondary: '#1E40AF',
      gradient: 'from-blue-800 to-blue-600'
    },
    icon: '🔷',
    description: 'Banco privado brasileiro tradicional'
  },
  {
    id: '12',
    name: 'Original',
    slug: 'original',
    displayName: 'Banco Original',
    shortName: 'Original',
    type: 'digital',
    color: {
      primary: '#00D959',
      secondary: '#22C55E',
      gradient: 'from-green-500 to-green-300'
    },
    icon: '💚',
    description: 'Banco digital inovador'
  },
  {
    id: '13',
    name: 'Next',
    slug: 'next',
    displayName: 'Banco Next',
    shortName: 'Next',
    type: 'digital',
    color: {
      primary: '#00AB63',
      secondary: '#16A34A',
      gradient: 'from-green-600 to-green-400'
    },
    icon: '🟢',
    description: 'Banco digital do Bradesco'
  },
  {
    id: '14',
    name: 'Neon',
    slug: 'neon',
    displayName: 'Neon',
    shortName: 'Neon',
    type: 'digital',
    color: {
      primary: '#00D9E1',
      secondary: '#06B6D4',
      gradient: 'from-cyan-500 to-cyan-300'
    },
    icon: '🔵',
    description: 'Banco digital sem tarifas'
  }
];

export function getBankById(id: string): BrazilianBank | undefined {
  return BRAZILIAN_BANKS.find(bank => bank.id === id);
}

export function getBankBySlug(slug: string): BrazilianBank | undefined {
  return BRAZILIAN_BANKS.find(bank => bank.slug === slug);
}

export function getDigitalBanks(): BrazilianBank[] {
  return BRAZILIAN_BANKS.filter(bank => bank.type === 'digital');
}

export function getTraditionalBanks(): BrazilianBank[] {
  return BRAZILIAN_BANKS.filter(bank => bank.type === 'traditional');
}
