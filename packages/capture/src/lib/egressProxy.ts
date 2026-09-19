import http from "node:http";
import net from "node:net";
import type { Duplex } from "node:stream";

import { createLogger } from "@ovr/logger";

import { resolvePublicAddress } from "./networkGuard";

const logger = createLogger("capture");

export type EgressProxy = { server: string; close: () => void };

// `hostname` is exactly as it appeared in the authority, so an IPv6 literal
// is still bracket-wrapped (e.g. "[::1]").
type Target = { hostname: string; port: number };

// Matches an HTTP authority ("host[:port]" — a Host header or a CONNECT
// target). Group 1 is the host: either a bracketed IPv6 literal kept intact
// ("[::1]"), or everything up to the first colon. Group 2 is the optional
// port.
const AUTHORITY = /^(\[[^\]]+\]|[^:]+)(?::(\d+))?$/;

// Splits an HTTP authority into a hostname/port pair. Falls back to
// `defaultPort` when the authority omits one, which happens for plain HTTP
// requests but never for CONNECT (its target always includes a port).
// Returns null for anything that fails to parse as a valid host or port.
const parseAuthority = (authority: string, defaultPort: number): Target | null => {
  const match = AUTHORITY.exec(authority);
  if (!match?.[1]) {
    return null;
  }

  const port = match[2] ? Number(match[2]) : defaultPort;
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    return null;
  }

  return { hostname: match[1], port };
};

export const startEgressProxy = (allowedOrigin: string): Promise<EgressProxy> => {
  const allowed = parseAuthority(new URL(allowedOrigin).host, 80);

  const resolveTarget = async ({ hostname, port }: Target): Promise<string | null> => {
    if (allowed && hostname === allowed.hostname && port === allowed.port) {
      return hostname;
    }
    return resolvePublicAddress(hostname);
  };

  return new Promise((resolve) => {
    const sockets = new Set<Duplex>();

    const track = (socket: Duplex) => {
      sockets.add(socket);
      socket.on("close", () => sockets.delete(socket));
    };

    const server = http.createServer((req, res) => {
      void (async () => {
        const url = URL.parse?.(req.url ?? "") ?? null;
        const target = url && parseAuthority(url.host, 80);
        const address = target && (await resolveTarget(target));

        if (!url || !target || !address) {
          logger.warn({ url: req.url }, "blocked capture page request to unsafe target");
          res.writeHead(403);
          res.end();
          return;
        }

        const upstream = http.request(
          {
            host: address,
            port: target.port,
            path: `${url.pathname}${url.search}`,
            method: req.method,
            headers: req.headers,
            setHost: false,
          },
          (upstreamRes) => {
            res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
            upstreamRes.pipe(res);
          },
        );

        upstream.on("error", () => {
          if (!res.headersSent) {
            res.writeHead(502);
          }
          res.end();
        });

        req.pipe(upstream);
      })();
    });

    server.on("connect", (req, clientSocket, head) => {
      track(clientSocket);

      void (async () => {
        const target = parseAuthority(req.url ?? "", 443);
        const address = target && (await resolveTarget(target));

        if (!target || !address) {
          logger.warn({ url: req.url }, "blocked capture page request to unsafe target");
          clientSocket.end("HTTP/1.1 403 Forbidden\r\n\r\n");
          return;
        }

        const upstream = net.connect(target.port, address, () => {
          clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
          if (head.length > 0) {
            upstream.write(head);
          }
          clientSocket.pipe(upstream);
          upstream.pipe(clientSocket);
        });

        track(upstream);
        upstream.on("error", () => clientSocket.destroy());
        clientSocket.on("error", () => upstream.destroy());
      })();
    });

    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (address === null || typeof address === "string") {
        throw new Error("Expected the egress proxy server to bind to a TCP port");
      }
      resolve({
        server: `http://127.0.0.1:${address.port}`,
        close: () => {
          server.close();
          for (const socket of sockets) {
            socket.destroy();
          }
          sockets.clear();
        },
      });
    });
  });
};
