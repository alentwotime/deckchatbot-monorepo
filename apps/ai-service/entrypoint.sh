#!/usr/bin/env bash
set -e

# =========================================================================
# AI Service Entrypoint Script
# =========================================================================
# This script performs comprehensive dependency checks and ensures that all
# required packages are available before starting the FastAPI application.
# It handles both Python packages and system-level dependencies, with
# graceful fallbacks and detailed error reporting.
# =========================================================================

# Set HOME to the appuser's home directory
export HOME="/home/appuser"

# Ensure we're using the correct Python path
export PYTHONPATH="/app:${PYTHONPATH}"

# Completely disable Poetry and virtualenv creation
export POETRY_DISABLED=1
export POETRY_VIRTUALENVS_CREATE=false
export POETRY_VIRTUALENVS_IN_PROJECT=false
export POETRY_NO_INTERACTION=1
export POETRY_CACHE_DIR="/tmp/poetry_cache"
export VIRTUAL_ENV_DISABLE_PROMPT=1
export VIRTUALENV_SYSTEM_SITE_PACKAGES=true
export POETRY_VIRTUALENVS_PATH="/tmp/poetry_venvs"
export POETRY_VIRTUALENVS_OPTIONS_ALWAYS_COPY=true
export POETRY_VIRTUALENVS_OPTIONS_NO_PIP=true
export POETRY_VIRTUALENVS_OPTIONS_NO_SETUPTOOLS=true

# Make sure all directories exist and are writable
mkdir -p /tmp/poetry_cache 2>/dev/null || true
mkdir -p /tmp/poetry_venvs 2>/dev/null || true
mkdir -p /tmp/runtime 2>/dev/null || true

# Try to set permissions, but don't fail if we can't
chmod 777 /tmp/poetry_cache 2>/dev/null || echo "Warning: Could not set permissions on /tmp/poetry_cache"
chmod 777 /tmp/poetry_venvs 2>/dev/null || echo "Warning: Could not set permissions on /tmp/poetry_venvs"
chmod 777 /tmp/runtime 2>/dev/null || echo "Warning: Could not set permissions on /tmp/runtime"

# If we can't write to /tmp directories, use user's home directory instead
if [ ! -w "/tmp/poetry_cache" ]; then
    echo "Warning: /tmp/poetry_cache is not writable, using ~/.poetry_cache instead"
    mkdir -p ~/.poetry_cache
    export POETRY_CACHE_DIR=~/.poetry_cache
fi

if [ ! -w "/tmp/poetry_venvs" ]; then
    echo "Warning: /tmp/poetry_venvs is not writable, using ~/.poetry_venvs instead"
    mkdir -p ~/.poetry_venvs
    export POETRY_VIRTUALENVS_PATH=~/.poetry_venvs
fi

if [ ! -w "/tmp/runtime" ]; then
    echo "Warning: /tmp/runtime is not writable, using ~/.runtime instead"
    mkdir -p ~/.runtime
    export RUNTIME_DIR=~/.runtime
fi

# Check for system dependencies
echo "Verifying system dependencies..."

# Function to check if we have sudo/root privileges
check_root_privileges() {
    if [ "$(id -u)" -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Check for tesseract-ocr
if ! command -v tesseract &> /dev/null; then
    echo "Warning: tesseract-ocr is not installed."
    if check_root_privileges; then
        echo "Installing tesseract-ocr..."
        apt-get update && apt-get install -y --no-install-recommends tesseract-ocr
    else
        echo "Cannot install tesseract-ocr: insufficient privileges. OCR functionality may not work properly."
    fi
fi

# Check for ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "Warning: ffmpeg is not installed."
    if check_root_privileges; then
        echo "Installing ffmpeg..."
        apt-get update && apt-get install -y --no-install-recommends ffmpeg
    else
        echo "Cannot install ffmpeg: insufficient privileges. Audio processing functionality may not work properly."
    fi
fi

# Check for libsndfile1
if ! ldconfig -p 2>/dev/null | grep libsndfile &> /dev/null; then
    echo "Warning: libsndfile1 is not installed or not in library path."
    if check_root_privileges; then
        echo "Installing libsndfile1..."
        apt-get update && apt-get install -y --no-install-recommends libsndfile1
    else
        echo "Cannot install libsndfile1: insufficient privileges. Audio processing functionality may not work properly."
    fi
fi

# Completely remove Poetry and virtualenv if found
if command -v poetry &> /dev/null || command -v virtualenv &> /dev/null; then
    echo "Warning: Poetry or virtualenv is still installed. Removing now..."
    pip uninstall -y poetry poetry-core poetry-plugin-export virtualenv 2>/dev/null || true
    pip freeze | grep -i poetry | xargs -r pip uninstall -y 2>/dev/null || true
    pip freeze | grep -i virtualenv | xargs -r pip uninstall -y 2>/dev/null || true
    # Remove any remaining Poetry files
    rm -rf /home/appuser/.poetry /home/appuser/.config/pypoetry /home/appuser/.cache/pypoetry 2>/dev/null || true
    rm -rf /root/.poetry /root/.config/pypoetry /root/.cache/pypoetry 2>/dev/null || true
fi

# Function to safely install a Python package
safe_pip_install() {
    package=$1
    version=$2
    echo "Installing $package $version..."
    if pip install --no-cache-dir $package$version 2>/dev/null; then
        echo "Successfully installed $package $version"
        return 0
    else
        echo "Failed to install $package $version. Some functionality may not work properly."
        # Try with --no-deps as a fallback
        echo "Trying installation with --no-deps as fallback..."
        if pip install --no-cache-dir --no-deps $package$version 2>/dev/null; then
            echo "Successfully installed $package $version with --no-deps"
            return 0
        else
            echo "Failed to install $package $version even with --no-deps."
            return 1
        fi
    fi
}

# Verify whisper and soundfile are installed
if ! python -c "import whisper" &> /dev/null; then
    echo "Warning: whisper module is not installed."
    safe_pip_install "openai-whisper" "==20231117"
    # Also try to install soundfile as it's a dependency of whisper
    if ! python -c "import soundfile" &> /dev/null; then
        safe_pip_install "soundfile" ""
    fi
fi

# Verify soundfile is installed
if ! python -c "import soundfile" &> /dev/null; then
    echo "Warning: soundfile module is not installed."
    safe_pip_install "soundfile" ""
fi

# Verify critical dependencies are installed
# Check for FastAPI
if ! python -c "import fastapi" &> /dev/null; then
    echo "Warning: fastapi module is not installed."
    safe_pip_install "fastapi" ""
fi

# Check for Pydantic
if ! python -c "import pydantic" &> /dev/null; then
    echo "Warning: pydantic module is not installed."
    safe_pip_install "pydantic" ""
fi

# Check for Pillow
if ! python -c "import PIL" &> /dev/null; then
    echo "Warning: PIL (Pillow) module is not installed."
    safe_pip_install "Pillow" ""
fi

# Check for OpenCV
if ! python -c "import cv2" &> /dev/null; then
    echo "Warning: cv2 (OpenCV) module is not installed."
    safe_pip_install "opencv-python-headless" ""
fi

# Check for NumPy
if ! python -c "import numpy" &> /dev/null; then
    echo "Warning: numpy module is not installed."
    safe_pip_install "numpy" ""
fi

# Check for pytesseract
if ! python -c "import pytesseract" &> /dev/null; then
    echo "Warning: pytesseract module is not installed."
    safe_pip_install "pytesseract" ""
fi

# Check for sentence_transformers
if ! python -c "import sentence_transformers" &> /dev/null; then
    echo "Warning: sentence_transformers module is not installed."
    safe_pip_install "sentence-transformers" ""
fi

# Check for torch
if ! python -c "import torch" &> /dev/null; then
    echo "Warning: torch module is not installed."
    safe_pip_install "torch" " --index-url https://download.pytorch.org/whl/cpu"
fi

# Verify chromadb dependencies are installed
echo "Checking chromadb dependencies..."
for dep in "pydantic" "requests" "tqdm" "typing_extensions" "numpy" "overrides" "posthog" "importlib_resources" "grpcio" "pypika"; do
    if ! pip show $dep &> /dev/null; then
        echo "Installing chromadb dependency: $dep"
        safe_pip_install "$dep" ""
    fi
done

# Handle hnswlib separately as it requires special build dependencies
if ! pip show hnswlib &> /dev/null; then
    echo "Installing chromadb dependency: hnswlib"
    if ! safe_pip_install "hnswlib" ""; then
        echo "Note: hnswlib installation failed. This is expected in some environments."
        echo "The application will continue to function using alternative similarity search methods."
    fi
fi

# Verify chromadb is installed
if ! python -c "import chromadb" &> /dev/null; then
    echo "Warning: chromadb module is not installed."
    # Try installing with all dependencies first
    if ! safe_pip_install "chromadb" "==0.4.22"; then
        # If that fails, try installing with --no-deps and then install key dependencies separately
        pip install --no-cache-dir --no-deps chromadb==0.4.22
        echo "Installed chromadb with --no-deps, now installing key dependencies..."
        # Skip hnswlib if we already tried to install it above
        if pip show hnswlib &> /dev/null; then
            echo "hnswlib is already installed, skipping..."
        else
            echo "Note: hnswlib may not install correctly, but chromadb can still function."
            safe_pip_install "hnswlib" "" || echo "hnswlib installation skipped, using alternative methods."
        fi
        safe_pip_install "pypika" ""
        safe_pip_install "overrides" ""
        safe_pip_install "posthog" ""
    fi
fi

# Verify click is installed (required by uvicorn)
if ! python -c "import click" &> /dev/null; then
    echo "Warning: click module is not installed."
    safe_pip_install "click" ""
fi

# Verify uvicorn dependencies
for dep in "h11" "httptools" "python-dotenv" "pyyaml" "uvloop" "watchfiles" "websockets"; do
    if ! pip show $dep &> /dev/null; then
        echo "Installing uvicorn dependency: $dep"
        safe_pip_install "$dep" ""
    fi
done

# Final verification of all critical dependencies
echo "Performing final verification of all critical dependencies..."
missing_deps=0

# List of critical Python packages to verify
critical_packages=("fastapi" "pydantic" "PIL" "cv2" "numpy" "pytesseract" "whisper" "soundfile" "chromadb" "sentence_transformers" "torch" "uvicorn" "transformers" "tokenizers" "huggingface_hub" "python_multipart" "starlette" "httpx" "click")

# hnswlib is optional - chromadb can use alternative methods
optional_packages=("hnswlib")

for package in "${critical_packages[@]}"; do
    if ! python -c "import $package" &> /dev/null; then
        echo "ERROR: $package is still not available after installation attempts!"
        missing_deps=$((missing_deps + 1))
    else
        echo "✓ $package is available"
    fi
done

# Check optional packages
for package in "${optional_packages[@]}"; do
    if ! python -c "import $package" &> /dev/null; then
        echo "NOTE: Optional package $package is not available. Some features may use alternatives."
    else
        echo "✓ Optional package $package is available"
    fi
done

if [ $missing_deps -gt 0 ]; then
    echo "WARNING: $missing_deps critical dependencies are still missing. The application may not function correctly."
else
    echo "All critical dependencies are available. Starting the application..."
fi

# Start the AI service FastAPI app directly without Poetry
exec uvicorn ai_service.main:app --host 0.0.0.0 --port "${PORT:-8000}"
