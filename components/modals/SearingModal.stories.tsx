import type { Meta, StoryObj } from '@storybook/react';
import { SearingModal } from './SearingModal';
import { TransactionStatus } from '@/types/blockchain';
import type { OwnedSearableConcord } from '@/hooks/useSearingConcords';
import type { ConcordSearingMap } from '@/lib/domain/searing/concord-searing-map';

const txHash = '0x1111111111111111111111111111111111111111111111111111111111111111' as const;

const concordMaps: ConcordSearingMap[] = [
  {
    token_name: 'Cauldron of Detriti',
    location: 'body',
    new_trait: 'detriti cauldron',
    makesBald: false,
    tokenId: '1',
    concordTokenId: 1,
  },
  {
    token_name: 'Witches Brush',
    location: 'head',
    new_trait: 'witch-marked',
    makesBald: true,
    tokenId: '2',
    concordTokenId: 2,
  },
];

function ownedConcord(map: ConcordSearingMap, amount: bigint): OwnedSearableConcord {
  return {
    concordId: map.concordTokenId,
    tokenId: map.tokenId,
    name: map.token_name,
    location: map.location,
    newTrait: map.new_trait,
    makesBald: map.makesBald,
    amount,
    imageUrl: `https://storage.googleapis.com/concord-images/${map.concordTokenId}.gif`,
    map,
    balance: {
      concordId: map.concordTokenId,
      tokenId: BigInt(map.concordTokenId),
      balance: amount,
      isOwned: amount > 0n,
      contractAddress: '0x0000000000000000000000000000000000000000',
    },
  };
}

const ownedConcords = [
  ownedConcord(concordMaps[0], 3n),
  ownedConcord(concordMaps[1], 1n),
];

const approvedSearingMock = {
  isSearing: false,
  isApproving: false,
  error: null,
  txHash: null,
  txStatus: TransactionStatus.IDLE,
  approvalStatus: {
    isWagdieApproved: true,
    isConcordApproved: true,
    isFullyApproved: true,
  },
  searConcords: async () => ({ success: true, hash: txHash }),
  checkApproval: async () => true,
  checkApprovalStatus: async () => ({
    isWagdieApproved: true,
    isConcordApproved: true,
    isFullyApproved: true,
  }),
  approveForSearing: async () => {},
  getConcordBalance: async () => null,
  getConcordBalances: async () => [],
};

const needsApprovalSearingMock = {
  ...approvedSearingMock,
  approvalStatus: {
    isWagdieApproved: false,
    isConcordApproved: true,
    isFullyApproved: false,
  },
  checkApproval: async () => false,
  checkApprovalStatus: async () => ({
    isWagdieApproved: false,
    isConcordApproved: true,
    isFullyApproved: false,
  }),
};

const concordsHookMock = {
  concords: ownedConcords,
  allSearableConcords: concordMaps,
  isLoading: false,
  error: null,
  refetch: async () => {},
};

const hookMocks = {
  useSearing: approvedSearingMock,
  useSearingConcords: concordsHookMock,
};

const meta: Meta<typeof SearingModal> = {
  component: SearingModal,
  title: 'Components/Modals/SearingModal',
  tags: ['autodocs'],
  argTypes: {
    wagdieId: {
      control: 'number',
      description: 'WAGDIE token ID',
    },
    wagdieName: {
      control: 'text',
      description: 'WAGDIE character name',
    },
    isOpen: {
      control: 'boolean',
      description: 'Whether the modal is open',
    },
    onClose: {
      action: 'closed',
      description: 'Close modal callback',
    },
    onSuccess: {
      action: 'success',
      description: 'Success callback after searing materialization completes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearingModal>;

export const Default: Story = {
  args: {
    wagdieId: 1234,
    wagdieName: 'Grimwald the Undying',
    isOpen: true,
    onClose: () => {},
    onSuccess: () => {},
  },
  parameters: {
    hookMocks,
  },
};

export const NoConcords: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    hookMocks: {
      ...hookMocks,
      useSearingConcords: {
        concords: [],
        allSearableConcords: concordMaps,
        isLoading: false,
        error: null,
        refetch: async () => {},
      },
    },
  },
};

export const NeedsApproval: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    hookMocks: {
      ...hookMocks,
      useSearing: needsApprovalSearingMock,
    },
  },
};

export const SelectedPreview: Story = {
  args: {
    ...Default.args,
    wagdieId: 5678,
    wagdieName: 'Shadow Walker',
  },
  parameters: {
    hookMocks,
    docs: {
      description: {
        story: 'The first owned searable Concord is auto-selected and shown in the preview panel.',
      },
    },
  },
};

export const Success: Story = {
  args: {
    ...Default.args,
    initialSyncState: {
      status: 'completed',
      imageUrl: 'https://storage.googleapis.com/seared-wagdie-images/5678/tx-story-log-0.png',
      message: 'The seared character image and metadata were updated.',
    },
  },
  parameters: {
    hookMocks: {
      ...hookMocks,
      useSearing: {
        ...approvedSearingMock,
        txHash,
        txStatus: TransactionStatus.SUCCESS,
      },
    },
  },
};

export const MaterializationFailed: Story = {
  args: {
    ...Default.args,
    initialSyncState: {
      status: 'failed',
      message: 'GCS credentials were unavailable while composing seared artwork.',
    },
  },
  parameters: {
    hookMocks: {
      ...hookMocks,
      useSearing: {
        ...approvedSearingMock,
        txHash,
        txStatus: TransactionStatus.SUCCESS,
      },
    },
  },
};

export const Closed: Story = {
  args: {
    ...Default.args,
    isOpen: false,
  },
  parameters: {
    hookMocks,
  },
};
