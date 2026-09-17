"""Testes de services/projetos.py: fonte única da verdade para o conteúdo
dos projetos, usada para montar o prompt de sistema da IA opcional."""
from services.projetos import montar_prompt_sistema, projeto_existe


def test_montar_prompt_sistema_projeto_valido_contem_perguntas_e_respostas():
    prompt = montar_prompt_sistema("pdz")

    assert prompt is not None
    assert "P:" in prompt
    assert "R:" in prompt


def test_montar_prompt_sistema_projeto_inexistente_retorna_none():
    assert montar_prompt_sistema("nao-existe") is None


def test_projeto_existe_para_projeto_valido():
    assert projeto_existe("pdz") is True


def test_projeto_existe_para_projeto_invalido():
    assert projeto_existe("nao-existe") is False


def test_ids_de_projeto_com_hifen_sao_traduzidos_para_faq_com_underscore():
    # swift-file -> faq_swift_file, game-verse -> faq_game_verse, etc.
    for id_projeto in ("matheus", "pdz", "swift-file", "game-verse", "reunioes-aut", "portfolio-interativo"):
        assert projeto_existe(id_projeto) is True
        assert montar_prompt_sistema(id_projeto) is not None
