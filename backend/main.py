from fastapi import FastAPI, WebSocket, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from project_manager import ProjectManager, Project
from typing import List
import asyncio

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

manager = ProjectManager()

@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    return manager.scan_projects()

@app.post("/api/projects/{id}/start")
async def start_project(id: str, port: int):
    try:
        manager.start_project(id, port)
        return {"status": "started", "port": port}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/projects/{id}/stop")
async def stop_project(id: str):
    try:
        manager.stop_project(id)
        return {"status": "stopped"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.websocket("/api/ws/{id}")
async def websocket_endpoint(websocket: WebSocket, id: str):
    await websocket.accept()
    try:
        logs = manager.get_project_logs(id)
        for log in logs:
            await websocket.send_text(log)
            
        last_idx = len(logs)
        while True:
            current_logs = manager.get_project_logs(id)
            if len(current_logs) > last_idx:
                new_lines = current_logs[last_idx:]
                for line in new_lines:
                    await websocket.send_text(line)
                last_idx = len(current_logs)
            await asyncio.sleep(0.1)
    except Exception:
        pass
    finally:
        await websocket.close()
