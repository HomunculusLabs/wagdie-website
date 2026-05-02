import { fireEvent, render, screen } from '@testing-library/react'
import { SearingConcordGrid } from '@/components/characters/searing/SearingConcordGrid'
import type { OwnedSearableConcord } from '@/hooks/useSearingConcords'

function ownedConcord(id: number, amount: bigint): OwnedSearableConcord {
  const map = {
    token_name: `Concord ${id}`,
    location: 'body',
    new_trait: `trait-${id}`,
    makesBald: false,
    tokenId: String(id),
    concordTokenId: id,
  }

  return {
    concordId: id,
    tokenId: String(id),
    name: `Concord ${id}`,
    location: 'body',
    newTrait: `trait-${id}`,
    makesBald: false,
    amount,
    imageUrl: `https://storage.googleapis.com/concord-images/${id}.gif`,
    map,
    balance: {
      concordId: id,
      tokenId: BigInt(id),
      balance: amount,
      isOwned: true,
      contractAddress: '0x0000000000000000000000000000000000000000',
    },
  }
}

describe('SearingConcordGrid', () => {
  it('renders owned Concords and emits the selected Concord object', () => {
    const onSelect = jest.fn()
    const concords = [ownedConcord(1, 2n), ownedConcord(3, 1n)]

    render(
      <SearingConcordGrid
        concords={concords}
        selectedConcordId={1}
        onSelect={onSelect}
      />
    )

    expect(screen.getByText('Concord 1')).toBeInTheDocument()
    expect(screen.getByText('×2')).toBeInTheDocument()
    expect(screen.getByRole('option', { selected: true })).toHaveTextContent('Concord 1')

    fireEvent.click(screen.getByText('Concord 3'))

    expect(onSelect).toHaveBeenCalledWith(concords[1])
  })

  it('shows an empty state when there are no owned searable Concords', () => {
    render(
      <SearingConcordGrid
        concords={[]}
        selectedConcordId={null}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByRole('status', { name: 'No owned searable Concords found' })).toBeInTheDocument()
  })
})
