"""Configuração compartilhada dos testes do backend.

Garante que a raiz do repositório esteja no sys.path (para `import app` e
`import services.projetos` funcionarem independente de onde o pytest for
invocado) e expõe fixtures comuns, como o client de testes do Flask.
"""
import os
import sys

_RAIZ_DO_REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if _RAIZ_DO_REPO not in sys.path:
    sys.path.insert(0, _RAIZ_DO_REPO)

import pytest

import app as app_module


@pytest.fixture
def client():
    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client
