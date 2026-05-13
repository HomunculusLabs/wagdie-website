describe('elizaConfig location room settings', () => {
  const originalEnv = process.env

  beforeEach(() => {
    jest.resetModules()
    process.env = { ...originalEnv }
    delete process.env.ELIZA_LOCATION_ROOMS_ENABLED
    delete process.env.ELIZA_LOCATION_ROOM_TICK_INTERVAL_MINUTES
    delete process.env.ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN
    delete process.env.ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW
  })

  afterAll(() => {
    process.env = originalEnv
  })

  it('defaults location rooms to disabled with conservative scheduler settings', async () => {
    const { elizaConfig } = await import('@/lib/eliza/config')

    expect(elizaConfig.locationRooms).toEqual({
      enabled: false,
      tickIntervalMinutes: 360,
      maxTicksPerRun: 5,
      transcriptWindow: 20,
    })
  })

  it('accepts valid location room environment overrides', async () => {
    process.env.ELIZA_LOCATION_ROOMS_ENABLED = 'true'
    process.env.ELIZA_LOCATION_ROOM_TICK_INTERVAL_MINUTES = '120'
    process.env.ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN = '3'
    process.env.ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW = '12'

    const { elizaConfig } = await import('@/lib/eliza/config')

    expect(elizaConfig.locationRooms).toEqual({
      enabled: true,
      tickIntervalMinutes: 120,
      maxTicksPerRun: 3,
      transcriptWindow: 12,
    })
  })

  it('falls back to safe defaults for invalid numeric overrides', async () => {
    process.env.ELIZA_LOCATION_ROOMS_ENABLED = 'not-a-boolean'
    process.env.ELIZA_LOCATION_ROOM_TICK_INTERVAL_MINUTES = '0'
    process.env.ELIZA_LOCATION_ROOM_MAX_TICKS_PER_RUN = '1.5'
    process.env.ELIZA_LOCATION_ROOM_TRANSCRIPT_WINDOW = '-1'

    const { elizaConfig } = await import('@/lib/eliza/config')

    expect(elizaConfig.locationRooms).toEqual({
      enabled: false,
      tickIntervalMinutes: 360,
      maxTicksPerRun: 5,
      transcriptWindow: 20,
    })
  })
})
