import os
import json
import subprocess
import threading
import psutil
import socket
from typing import List, Optional, Dict
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Project(BaseModel):
    id: str
    name: str
    path: str
    type: str
    status: str = "offline"
    port: int = 0
    pid: Optional[int] = None

class ProjectManager:
    def __init__(self):
        self.project_path = os.getenv("PROJECT_PATH")
        self.exclude_apps = json.loads(os.getenv("EXCLUDE_APPS", "[]"))
        self.projects: Dict[str, Project] = {}
        self.processes: Dict[str, subprocess.Popen] = {}
        self.logs: Dict[str, List[str]] = {}

    def scan_projects(self) -> List[Project]:
        if not self.project_path or not os.path.exists(self.project_path):
            return []

        found_projects = []
        for entry in os.scandir(self.project_path):
            if entry.is_dir() and entry.name not in self.exclude_apps:
                project_type = self._detect_project_type(entry.path)
                if project_type:
                    project_id = entry.name
                    # Preserve status if already exists
                    current = self.projects.get(project_id)
                    status = current.status if current else "offline"
                    pid = current.pid if current else None
                    port = current.port if current else self._get_default_port(project_type)
                    
                    project = Project(
                        id=project_id,
                        name=entry.name,
                        path=entry.path,
                        type=project_type,
                        status=status,
                        port=port,
                        pid=pid
                    )
                    self.projects[project_id] = project
                    found_projects.append(project)
        return found_projects

    def _detect_project_type(self, path: str) -> Optional[str]:
        pkg_path = os.path.join(path, "package.json")
        if os.path.exists(pkg_path):
            try:
                with open(pkg_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    deps = data.get("dependencies", {})
                    dev_deps = data.get("devDependencies", {})
                    all_deps = {**deps, **dev_deps}
                    
                    if "next" in all_deps:
                        return "nextjs"
                    if "vite" in all_deps:
                        return "vite"
                    return "react"
            except:
                return "react"

        if os.path.exists(os.path.join(path, "main.py")) or os.path.exists(os.path.join(path, "app.py")) or os.path.exists(os.path.join(path, "requirements.txt")):
            return "python"
        if os.path.exists(os.path.join(path, "index.html")):
            return "static"
        return None

    def _get_default_port(self, type: str) -> int:
        if type == "vite":
            return 5173
        if type == "nextjs":
            return 3000
        if type == "react":
            return 3000
        if type == "python":
            return 8000
        return 8080

    def _is_port_in_use(self, port: int) -> bool:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0

    def start_project(self, project_id: str, port: int):
        if project_id not in self.projects:
            raise ValueError("Project not found")

        project = self.projects[project_id]
        if project.status == "online":
            return

        if self._is_port_in_use(port):
             raise ValueError(f"Port {port} is already in use.")

        cmd = self._get_start_command(project, port)
        if not cmd:
            raise ValueError(f"Could not determine start command for {project.type}")

        process = subprocess.Popen(
            cmd,
            shell=True,
            cwd=project.path,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        self.processes[project_id] = process
        project.pid = process.pid
        project.status = "online"
        project.port = port
        self.logs[project_id] = []

        threading.Thread(target=self._log_reader, args=(project_id, process), daemon=True).start()

    def stop_project(self, project_id: str):
        if project_id in self.processes:
            process = self.processes[project_id]
            try:
                parent = psutil.Process(process.pid)
                for child in parent.children(recursive=True):
                    child.kill()
                parent.kill()
            except psutil.NoSuchProcess:
                pass
            
            del self.processes[project_id]
            self.projects[project_id].status = "offline"
            self.projects[project_id].pid = None

    def _get_start_command(self, project: Project, port: int) -> str:
        if project.type == "vite":
            return f"npm run dev -- --port {port} --host"
        elif project.type == "nextjs":
            return f"npm run dev -- -p {port}"
        elif project.type == "react":
            return f"npm start"
        elif project.type == "python":
            venv_activate = ""
            possible_venvs = ["venv", ".venv", "env"]
            for venv in possible_venvs:
                venv_path = os.path.join(project.path, venv)
                if os.path.exists(venv_path):
                    if os.name == 'nt':
                        activate_script = os.path.join(venv_path, "Scripts", "activate.bat")
                        if os.path.exists(activate_script):
                             venv_activate = f'"{activate_script}" && '
                    else:
                        activate_script = os.path.join(venv_path, "bin", "activate")
                        if os.path.exists(activate_script):
                            venv_activate = f'. "{activate_script}" && '
                    break

            base_cmd = f"python main.py"
            if os.path.exists(os.path.join(project.path, "main.py")):
                 with open(os.path.join(project.path, "main.py"), 'r', encoding='utf-8', errors='ignore') as f:
                     content = f.read()
                     if "FastAPI" in content:
                         base_cmd = f"uvicorn main:app --host 0.0.0.0 --port {port} --reload"
                     else:
                         base_cmd = f"python main.py"
            elif os.path.exists(os.path.join(project.path, "app.py")):
                base_cmd = f"python app.py"
            
            return f"{venv_activate}{base_cmd}"
            
        elif project.type == "static":
            return f"python -m http.server {port}"
        return ""

    def _log_reader(self, project_id: str, process: subprocess.Popen):
        for line in iter(process.stdout.readline, ''):
            if line:
                if project_id not in self.logs:
                    self.logs[project_id] = []
                self.logs[project_id].append(line)
                if len(self.logs[project_id]) > 1000:
                    self.logs[project_id].pop(0)
        
        if project_id in self.projects and self.projects[project_id].status == "online":
             self.projects[project_id].status = "offline"
             self.projects[project_id].pid = None

    def get_project_logs(self, project_id: str) -> List[str]:
        return self.logs.get(project_id, [])

