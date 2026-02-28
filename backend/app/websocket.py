"""WebSocket endpoint for real-time fraud alerts."""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
import asyncio

ws_router = APIRouter()

# Active WebSocket connections
active_connections: List[WebSocket] = []


@ws_router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    """WebSocket endpoint for real-time alert streaming."""
    await websocket.accept()
    active_connections.append(websocket)

    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connection",
            "message": "Connected to IntelliTrace Alert Stream",
            "active_connections": len(active_connections),
        })

        while True:
            # Keep connection alive, listen for client messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        active_connections.remove(websocket)


async def broadcast_alert(alert_data: dict):
    """Broadcast an alert to all connected clients."""
    disconnected = []
    for ws in active_connections:
        try:
            await ws.send_json({
                "type": "alert",
                "data": alert_data,
            })
        except Exception:
            disconnected.append(ws)

    for ws in disconnected:
        active_connections.remove(ws)
