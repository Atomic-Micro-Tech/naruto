#!/usr/bin/env python3
"""Run the local game; keep credentials stable and never reset an existing database."""
import argparse
import base64
import json
import os
from pathlib import Path
import secrets
import shutil
import signal
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent
LOCAL = ROOT / '.local'


def run(command, cwd=ROOT, env=None):
    subprocess.run(command, cwd=cwd, env=env, check=True)


def environment():
    LOCAL.mkdir(mode=0o700, exist_ok=True)
    env = os.environ.copy()
    if not env.get('NARUTO_APP_KEY'):
        key_path = LOCAL / 'app.key'
        if not key_path.exists():
            descriptor = os.open(key_path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(descriptor, 'w') as output:
                output.write(base64.b64encode(secrets.token_bytes(32)).decode() + '\n')
        env['NARUTO_APP_KEY'] = key_path.read_text().strip()
    env.setdefault('LIVEKIT_API_KEY', 'devkey')
    env.setdefault('LIVEKIT_API_SECRET', 'secret')
    return env


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--setup', action='store_true', help='Start Compose dependencies, install packages, migrate, and seed synthetic dev accounts.')
    parser.add_argument('--build', action='store_true', help='Serve the built frontend from Go on port 8080 instead of Vite 5173.')
    args = parser.parse_args()
    for executable in ('go', 'npm'):
        if not shutil.which(executable):
            parser.error(f'{executable} is required (Go 1.26+, Node 22.12+).')
    env = environment()
    if args.setup:
        run(['docker', 'compose', '-f', 'compose.yaml', 'up', '-d', '--no-recreate', '--wait'], env=env)
        python = LOCAL / 'venv' / ('Scripts/python.exe' if os.name == 'nt' else 'bin/python')
        if not python.exists():
            run([sys.executable, '-m', 'venv', str(LOCAL / 'venv')])
        run([str(python), '-m', 'pip', 'install', '-r', 'server/scripts/requirements.txt'])
        run([str(python), 'scripts/migrate.py'], ROOT / 'server', env)
        run([str(python), 'scripts/seed.py'], ROOT / 'server', env)
        run(['npm', 'ci'], ROOT / 'client', env)
    if not (ROOT / 'client/node_modules').exists():
        parser.error('Frontend dependencies are missing. Run python3 dev.py --setup first.')
    run(['npm', 'run', 'build:rules'], ROOT / 'client', env)
    if args.build:
        run(['npm', 'run', 'build'], ROOT / 'client', env)
        config = json.loads((ROOT / 'server/configs/config.json').read_text())
        config['mail']['public_url'] = 'http://127.0.0.1:8080'
        config_path = LOCAL / 'config-built.json'
        config_path.write_text(json.dumps(config, indent=2) + '\n')
        config_path.chmod(0o600)
        env['NARUTO_CONFIG'] = str(config_path)
    binary = LOCAL / ('narutoserver.exe' if os.name == 'nt' else 'narutoserver')
    run(['go', 'build', '-o', str(binary), './cmd/api'], ROOT / 'server', env)
    processes = []
    stopping = False

    def stop(signum=None, frame=None):
        nonlocal stopping
        stopping = True
        for process in processes:
            if os.name == 'posix':
                try:
                    os.killpg(process.pid, signal.SIGTERM)
                except ProcessLookupError:
                    pass
            elif process.poll() is None:
                process.terminate()

    signal.signal(signal.SIGINT, stop)
    signal.signal(signal.SIGTERM, stop)
    try:
        processes.append(subprocess.Popen([str(binary)], cwd=ROOT / 'server', env=env, start_new_session=os.name == 'posix'))
        if not args.build:
            processes.append(subprocess.Popen(['npm', 'run', 'dev'], cwd=ROOT / 'client', env=env, start_new_session=os.name == 'posix'))
        print(f"\nNaruto Online: http://127.0.0.1:{8080 if args.build else 5173}", flush=True)
        print('Email inbox: http://127.0.0.1:8025 · Ctrl+C stops API/frontend; Compose data is retained.', flush=True)
        while not stopping and all(process.poll() is None for process in processes):
            time.sleep(0.25)
        if not stopping:
            raise RuntimeError('A dev process stopped. Read its error above; check occupied ports/configuration.')
    finally:
        stop()
        for process in processes:
            try:
                process.wait(timeout=12)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait()


if __name__ == '__main__':
    try:
        main()
    except (subprocess.CalledProcessError, RuntimeError) as error:
        print(f'Dev startup failed: {error}', file=sys.stderr)
        sys.exit(1)
