import Peer from 'peerjs';
import type { DataConnection } from 'peerjs';

export interface MultiplayerPlayer {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

export type MultiplayerStatus = 'disconnected' | 'creating' | 'waiting' | 'joining' | 'connected' | 'error';

export interface MultiplayerMessage {
  type: 'HANDSHAKE' | 'SYNC_STATE' | 'GAME_ACTION' | 'CHAT' | 'RESTART';
  senderId: string;
  senderName: string;
  payload?: any;
  timestamp: number;
}

export type MessageHandler = (msg: MultiplayerMessage) => void;
export type StatusHandler = (status: MultiplayerStatus, details?: string) => void;

class MultiplayerManager {
  private peer: Peer | null = null;
  private connection: DataConnection | null = null;
  private status: MultiplayerStatus = 'disconnected';
  private roomCode: string = '';
  private isHost: boolean = false;
  private localPlayer: MultiplayerPlayer | null = null;
  private remotePlayer: MultiplayerPlayer | null = null;

  private messageListeners: Set<MessageHandler> = new Set();
  private statusListeners: Set<StatusHandler> = new Set();

  private prefix = 'casino-imperial-room-';

  public getStatus(): MultiplayerStatus {
    return this.status;
  }

  public getRoomCode(): string {
    return this.roomCode;
  }

  public getIsHost(): boolean {
    return this.isHost;
  }

  public getRemotePlayer(): MultiplayerPlayer | null {
    return this.remotePlayer;
  }

  public onMessage(handler: MessageHandler): () => void {
    this.messageListeners.add(handler);
    return () => this.messageListeners.delete(handler);
  }

  public onStatusChange(handler: StatusHandler): () => void {
    this.statusListeners.add(handler);
    return () => this.statusListeners.delete(handler);
  }

  private setStatus(status: MultiplayerStatus, details?: string) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status, details));
  }

  /**
   * Host creates a room with a 4 or 5 digit code
   */
  public async createRoom(player: { id: string; name: string; avatar: string }): Promise<string> {
    this.disconnect();
    this.isHost = true;
    this.localPlayer = { ...player, isHost: true };
    this.setStatus('creating');

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    this.roomCode = code;
    const peerId = `${this.prefix}${code}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer(peerId, {
          debug: 1,
        });

        this.peer.on('open', () => {
          this.setStatus('waiting');
          resolve(code);
        });

        this.peer.on('connection', (conn) => {
          this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Host Error:', err);
          this.setStatus('error', err.message);
          reject(err);
        });
      } catch (err) {
        this.setStatus('error', String(err));
        reject(err);
      }
    });
  }

  /**
   * Guest joins an existing room
   */
  public async joinRoom(code: string, player: { id: string; name: string; avatar: string }): Promise<void> {
    this.disconnect();
    this.isHost = false;
    this.roomCode = code.trim().toUpperCase();
    this.localPlayer = { ...player, isHost: false };
    this.setStatus('joining');

    const hostPeerId = `${this.prefix}${this.roomCode}`;

    return new Promise((resolve, reject) => {
      try {
        this.peer = new Peer({
          debug: 1,
        });

        this.peer.on('open', () => {
          if (!this.peer) return;
          const conn = this.peer.connect(hostPeerId, {
            reliable: true,
          });

          this.setupConnection(conn);
          resolve();
        });

        this.peer.on('error', (err) => {
          console.error('PeerJS Join Error:', err);
          this.setStatus('error', 'No se pudo conectar a la mesa. Verifica el código.');
          reject(err);
        });
      } catch (err) {
        this.setStatus('error', String(err));
        reject(err);
      }
    });
  }

  private setupConnection(conn: DataConnection) {
    this.connection = conn;

    conn.on('open', () => {
      this.setStatus('connected');
      // Send handshake
      this.send({
        type: 'HANDSHAKE',
        senderId: this.localPlayer?.id || 'anon',
        senderName: this.localPlayer?.name || 'Jugador',
        payload: this.localPlayer,
        timestamp: Date.now(),
      });
    });

    conn.on('data', (data) => {
      const msg = data as MultiplayerMessage;
      if (msg.type === 'HANDSHAKE' && msg.payload) {
        this.remotePlayer = msg.payload as MultiplayerPlayer;
      }
      this.messageListeners.forEach((fn) => fn(msg));
    });

    conn.on('close', () => {
      this.remotePlayer = null;
      this.setStatus(this.isHost ? 'waiting' : 'disconnected', 'El otro jugador se ha desconectado.');
    });

    conn.on('error', (err) => {
      console.error('Conn Error:', err);
      this.setStatus('error', err.message);
    });
  }

  /**
   * Send a game action or sync state to peer
   */
  public send(msg: Omit<MultiplayerMessage, 'timestamp'> | MultiplayerMessage) {
    if (this.connection && this.connection.open) {
      const payload: MultiplayerMessage = {
        ...msg,
        timestamp: Date.now(),
      };
      this.connection.send(payload);
    }
  }

  public disconnect() {
    if (this.connection) {
      try {
        this.connection.close();
      } catch {
        // Ignore
      }
      this.connection = null;
    }
    if (this.peer) {
      try {
        this.peer.destroy();
      } catch {
        // Ignore
      }
      this.peer = null;
    }
    this.remotePlayer = null;
    this.status = 'disconnected';
    this.roomCode = '';
  }
}

export const multiplayer = new MultiplayerManager();
