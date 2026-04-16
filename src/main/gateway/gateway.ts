export abstract class Gateway {
  abstract initialize(): void | Promise<void>
  abstract destroy(): void | Promise<void>
  abstract sendMessage(channel: string, ...args: unknown[]): void | Promise<void>
  abstract getPairingCode(): string | null
  abstract getStatus(): string | null
}
