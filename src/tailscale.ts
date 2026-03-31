import { execSync } from 'child_process';
import { echo } from 'zx';

export interface TailscaleInfo {
  ip: string | null;
  hostname: string | null;
  isConnected: boolean;
}

export interface NetworkInfo {
  tailscale: TailscaleInfo;
  localIp: string | null;
}

export async function getTailscaleInfo(): Promise<TailscaleInfo> {
  try {
    const output = execSync('tailscale status --json 2>/dev/null', { encoding: 'utf-8' });
    const status = JSON.parse(output);
    
    const self = status.Self;
    if (self && self.CurredAddr) {
      return {
        ip: self.CurrAddr.replace(/:.*$/, ''),
        hostname: self.HostName,
        isConnected: true,
      };
    }
  } catch {
    // Tailscale not running or not installed
  }
  
  return {
    ip: null,
    hostname: null,
    isConnected: false,
  };
}

export async function getTailscaleIP(): Promise<string | null> {
  const info = await getTailscaleInfo();
  return info.ip;
}

export async function getLocalIP(): Promise<string | null> {
  try {
    const output = execSync("ip route get 1 | awk '{print $6; exit}' 2>/dev/null || hostname -I | awk '{print $1}'", { encoding: 'utf-8' });
    return output.trim() || null;
  } catch {
    try {
      const output = execSync("ifconfig | grep 'inet ' | grep -v 127.0.0.1 | head -1 | awk '{print $2}'", { encoding: 'utf-8' });
      return output.trim() || null;
    } catch {
      return null;
    }
  }
}

export async function getNetworkInfo(): Promise<NetworkInfo> {
  const [tailscale, localIp] = await Promise.all([
    getTailscaleInfo(),
    getLocalIP(),
  ]);
  
  return { tailscale, localIp };
}

export function isTailscaleInstalled(): boolean {
  try {
    execSync('which tailscale', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
