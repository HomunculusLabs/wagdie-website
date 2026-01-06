/**
 * Discord Embed Builders
 * Creates rich embeds for each event type
 */

import type {
  DiscordEmbed,
  DiscordWebhookPayload,
  DiscordOutboxRow,
  TransferPayload,
  BurnPayload,
  TravelPayload,
  SearPayload,
  ConcordTransferPayload,
  EventContext,
  NotifierConfig,
} from './types'

// =============================================================================
// Color Constants (Discord uses decimal colors)
// =============================================================================

export const EMBED_COLORS = {
  transfer: 0x2b90ff, // Blue - ownership change
  burn: 0xd64541, // Red - destruction
  travel: 0x1abc9c, // Teal - movement
  sear: 0xf39c12, // Orange - fire/searing
  concord_mint: 0x27ae60, // Green - creation
  concord_transfer: 0x27ae60, // Green - movement
  concord_burn: 0x7f8c8d, // Gray - destruction
} as const

// =============================================================================
// Address Formatting
// =============================================================================

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const DEAD_ADDRESS = '0x000000000000000000000000000000000000dead'

function shortAddress(address: string): string {
  if (address === ZERO_ADDRESS) return 'Null Address'
  if (address.toLowerCase() === DEAD_ADDRESS) return 'Dead Address'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function isZeroAddress(address: string): boolean {
  return address.toLowerCase() === ZERO_ADDRESS.toLowerCase()
}

function isDeadAddress(address: string): boolean {
  return address.toLowerCase() === DEAD_ADDRESS.toLowerCase()
}

// =============================================================================
// Embed Builders
// =============================================================================

/**
 * Build embed for transfer events (ownership changes)
 */
export function buildTransferEmbed(
  event: DiscordOutboxRow<TransferPayload>,
  ctx: EventContext
): DiscordEmbed {
  const { payload } = event
  const isMint = payload.isMint || isZeroAddress(payload.from)

  const title = isMint
    ? `Minted: WAGDIE #${event.token_id}`
    : `Transfer: WAGDIE #${event.token_id}`

  const description = isMint ? 'New character minted' : 'Ownership changed'

  const fields = [
    ...(isMint
      ? []
      : [{ name: 'From', value: shortAddress(payload.from), inline: true }]),
    { name: 'To', value: shortAddress(payload.to), inline: true },
    {
      name: 'Transaction',
      value: `[View on Etherscan](${ctx.explorerTxUrl})`,
      inline: false,
    },
  ]

  return {
    title,
    description,
    color: EMBED_COLORS.transfer,
    thumbnail: ctx.character?.imageUrl
      ? { url: ctx.character.imageUrl }
      : undefined,
    fields,
    timestamp: new Date().toISOString(),
  }
}

/**
 * Build embed for burn events
 */
export function buildBurnEmbed(
  event: DiscordOutboxRow<BurnPayload>,
  ctx: EventContext
): DiscordEmbed {
  const { payload } = event

  const locationName = ctx.toLocation?.name || `Location #${payload.locationId}`

  return {
    title: `Burned: WAGDIE #${event.token_id}`,
    description: `Character burned at ${locationName}`,
    color: EMBED_COLORS.burn,
    thumbnail: ctx.character?.imageUrl
      ? { url: ctx.character.imageUrl }
      : undefined,
    fields: [
      { name: 'Location', value: locationName, inline: true },
      ...(payload.ownerAddress
        ? [{ name: 'Owner', value: shortAddress(payload.ownerAddress), inline: true }]
        : []),
      {
        name: 'Transaction',
        value: `[View on Etherscan](${ctx.explorerTxUrl})`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Build embed for travel/location change events
 */
export function buildTravelEmbed(
  event: DiscordOutboxRow<TravelPayload>,
  ctx: EventContext
): DiscordEmbed {
  const { payload } = event

  const fromName = ctx.fromLocation?.name || `Location #${payload.oldLocationId}`
  const toName = ctx.toLocation?.name || `Location #${payload.newLocationId}`

  return {
    title: `Travel: WAGDIE #${event.token_id}`,
    description: 'Character moved to a new location',
    color: EMBED_COLORS.travel,
    thumbnail: ctx.character?.imageUrl
      ? { url: ctx.character.imageUrl }
      : undefined,
    fields: [
      { name: 'From', value: fromName, inline: true },
      { name: 'To', value: toName, inline: true },
      ...(payload.ownerAddress
        ? [{ name: 'Owner', value: shortAddress(payload.ownerAddress), inline: true }]
        : []),
      {
        name: 'Transaction',
        value: `[View on Etherscan](${ctx.explorerTxUrl})`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Build embed for searing events
 */
export function buildSearEmbed(
  event: DiscordOutboxRow<SearPayload>,
  ctx: EventContext
): DiscordEmbed {
  const { payload } = event

  return {
    title: `Seared: WAGDIE #${event.token_id}`,
    description: `Concord #${payload.concordId} seared onto character`,
    color: EMBED_COLORS.sear,
    thumbnail: ctx.character?.imageUrl
      ? { url: ctx.character.imageUrl }
      : undefined,
    fields: [
      { name: 'Concord', value: `#${payload.concordId}`, inline: true },
      ...(payload.owner
        ? [{ name: 'Owner', value: shortAddress(payload.owner), inline: true }]
        : []),
      {
        name: 'Transaction',
        value: `[View on Etherscan](${ctx.explorerTxUrl})`,
        inline: false,
      },
    ],
    timestamp: new Date().toISOString(),
  }
}

/**
 * Build embed for concord transfer events
 */
export function buildConcordTransferEmbed(
  event: DiscordOutboxRow<ConcordTransferPayload>,
  ctx: EventContext
): DiscordEmbed {
  const { payload } = event

  let title: string
  let description: string
  let color: number

  if (payload.isMint) {
    title = `Concord Minted: #${event.token_id}`
    description = `${payload.amount}x concord minted`
    color = EMBED_COLORS.concord_mint
  } else if (payload.isBurn) {
    title = `Concord Burned: #${event.token_id}`
    description = `${payload.amount}x concord burned`
    color = EMBED_COLORS.concord_burn
  } else {
    title = `Concord Transfer: #${event.token_id}`
    description = `${payload.amount}x concord transferred`
    color = EMBED_COLORS.concord_transfer
  }

  const fields = [
    ...(payload.isMint
      ? []
      : [{ name: 'From', value: shortAddress(payload.from), inline: true }]),
    ...(payload.isBurn
      ? []
      : [{ name: 'To', value: shortAddress(payload.to), inline: true }]),
    { name: 'Amount', value: `${payload.amount}`, inline: true },
    ...(payload.operator !== payload.from
      ? [{ name: 'Operator', value: shortAddress(payload.operator), inline: true }]
      : []),
    {
      name: 'Transaction',
      value: `[View on Etherscan](${ctx.explorerTxUrl})`,
      inline: false,
    },
  ]

  return {
    title,
    description,
    color,
    fields,
    timestamp: new Date().toISOString(),
  }
}

// =============================================================================
// Main Embed Builder
// =============================================================================

/**
 * Build the appropriate embed based on event type
 */
export function buildEmbed(
  event: DiscordOutboxRow,
  ctx: EventContext
): DiscordEmbed {
  switch (event.event_type) {
    case 'transfer':
      return buildTransferEmbed(
        event as DiscordOutboxRow<TransferPayload>,
        ctx
      )
    case 'burn':
      return buildBurnEmbed(event as DiscordOutboxRow<BurnPayload>, ctx)
    case 'travel':
      return buildTravelEmbed(event as DiscordOutboxRow<TravelPayload>, ctx)
    case 'sear':
      return buildSearEmbed(event as DiscordOutboxRow<SearPayload>, ctx)
    case 'concord_transfer':
      return buildConcordTransferEmbed(
        event as DiscordOutboxRow<ConcordTransferPayload>,
        ctx
      )
    default:
      throw new Error(`Unknown event type: ${event.event_type}`)
  }
}

/**
 * Build the full webhook payload
 */
export function buildWebhookPayload(
  event: DiscordOutboxRow,
  ctx: EventContext,
  config: NotifierConfig
): DiscordWebhookPayload {
  const embed = buildEmbed(event, ctx)

  return {
    username: config.webhookUsername,
    avatar_url: config.webhookAvatarUrl,
    embeds: [embed],
  }
}
