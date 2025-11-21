import { ethers } from 'ethers'
import { getProvider } from '../provider'

export abstract class BaseEventListener {
  protected contract: ethers.Contract
  protected provider: ethers.JsonRpcProvider

  constructor(
    contractAddress: string,
    abi: ethers.InterfaceAbi
  ) {
    this.provider = getProvider()
    this.contract = new ethers.Contract(contractAddress, abi, this.provider)
  }

  /**
   * Start listening to events from a specific block
   */
  async startListening(fromBlock: number = 0): Promise<void> {
    console.log(`🎧 Starting ${this.constructor.name} from block ${fromBlock}`)

    // Listen to new events
    this.setupEventListeners()

    // Index historical events
    if (fromBlock > 0) {
      await this.indexHistoricalEvents(fromBlock)
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(): void {
    this.contract.removeAllListeners()
    console.log(`🛑 Stopped ${this.constructor.name}`)
  }

  /**
   * Setup real-time event listeners
   */
  protected abstract setupEventListeners(): void

  /**
   * Index historical events from a starting block
   */
  protected abstract indexHistoricalEvents(fromBlock: number): Promise<void>

  /**
   * Process a single event
   */
  protected abstract processEvent(event: ethers.Log, parsedLog: ethers.LogDescription): Promise<void>
}
