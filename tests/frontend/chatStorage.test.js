import { test } from "node:test";
import assert from "node:assert/strict";

// chatStorage.js depende do global `localStorage`, que não existe em Node
// puro. Antes de importar o módulo, instalamos um polyfill mínimo em cima
// de um Map. Isso precisa acontecer ANTES do import estático do módulo,
// então usamos um import dinâmico (top-level await) depois de configurar
// o polyfill.
const storageMap = new Map();

globalThis.localStorage = {
    getItem(key) {
        return storageMap.has(key) ? storageMap.get(key) : null;
    },
    setItem(key, value) {
        storageMap.set(key, String(value));
    },
    removeItem(key) {
        storageMap.delete(key);
    },
    clear() {
        storageMap.clear();
    }
};

// Mesma chave usada internamente por chatStorage.js (CHATS_STORAGE_KEY).
// Não é exportada pelo módulo, então repetimos aqui apenas para poder
// testar o caso de corrupção de dados.
const CHATS_STORAGE_KEY = "meus_chats";

const {
    lerChatsDoStorage,
    salvarChatsNoStorage,
    carregarMensagensDoContato,
    salvarMensagemNoContato,
    limparHistoricoDoContato
} = await import("../../public/js/chatStorage.js");

test.beforeEach(() => {
    storageMap.clear();
});

test("salvarMensagemNoContato grava e carregarMensagensDoContato relê a mensagem", () => {
    const mensagem = salvarMensagemNoContato("pdz", "Olá!", true);

    assert.equal(mensagem.texto, "Olá!");
    assert.equal(mensagem.souEu, true);
    assert.equal(typeof mensagem.data, "string");

    const mensagens = carregarMensagensDoContato("pdz");
    assert.equal(mensagens.length, 1);
    assert.equal(mensagens[0].texto, "Olá!");
    assert.equal(mensagens[0].souEu, true);
});

test("salvarMensagemNoContato acumula múltiplas mensagens do mesmo contato", () => {
    salvarMensagemNoContato("pdz", "primeira", true);
    salvarMensagemNoContato("pdz", "segunda", false);

    const mensagens = carregarMensagensDoContato("pdz");
    assert.equal(mensagens.length, 2);
    assert.equal(mensagens[0].texto, "primeira");
    assert.equal(mensagens[1].texto, "segunda");
});

test("salvarMensagemNoContato preserva meta.translationKey e translationValues quando presentes", () => {
    const mensagem = salvarMensagemNoContato("pdz", "texto", false, {
        translationKey: "chave_x",
        translationValues: { nome: "Ana" }
    });

    assert.equal(mensagem.translationKey, "chave_x");
    assert.deepEqual(mensagem.translationValues, { nome: "Ana" });

    const [salva] = carregarMensagensDoContato("pdz");
    assert.equal(salva.translationKey, "chave_x");
    assert.deepEqual(salva.translationValues, { nome: "Ana" });
});

test("salvarMensagemNoContato ignora meta sem translationKey/translationValues", () => {
    const mensagem = salvarMensagemNoContato("pdz", "texto", false, {});
    assert.equal("translationKey" in mensagem, false);
    assert.equal("translationValues" in mensagem, false);
});

test("carregarMensagensDoContato de contato sem histórico retorna array vazio", () => {
    const mensagens = carregarMensagensDoContato("contato-inexistente");
    assert.deepEqual(mensagens, []);
});

test("limparHistoricoDoContato remove o histórico existente e retorna true", () => {
    salvarMensagemNoContato("swift-file", "oi", true);
    assert.equal(carregarMensagensDoContato("swift-file").length, 1);

    const resultado = limparHistoricoDoContato("swift-file");
    assert.equal(resultado, true);
    assert.deepEqual(carregarMensagensDoContato("swift-file"), []);
});

test("limparHistoricoDoContato retorna false para contato já limpo ou nunca criado", () => {
    // Nunca criado.
    assert.equal(limparHistoricoDoContato("nunca-existiu"), false);

    // Já limpo.
    salvarMensagemNoContato("game-verse", "oi", true);
    assert.equal(limparHistoricoDoContato("game-verse"), true);
    assert.equal(limparHistoricoDoContato("game-verse"), false);
});

test("lerChatsDoStorage retorna {} quando não há nada salvo", () => {
    assert.deepEqual(lerChatsDoStorage(), {});
});

test("lerChatsDoStorage não lança exceção e retorna {} para JSON corrompido", () => {
    localStorage.setItem(CHATS_STORAGE_KEY, "{isso nao e json valido");

    assert.doesNotThrow(() => {
        const chats = lerChatsDoStorage();
        assert.deepEqual(chats, {});
    });
});

test("lerChatsDoStorage retorna {} quando o valor salvo é um JSON válido de tipo primitivo (ex.: número)", () => {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(42));
    assert.deepEqual(lerChatsDoStorage(), {});
});

test("lerChatsDoStorage normaliza para {} quando o JSON salvo é um array (typeof array também é 'object')", () => {
    localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify([1, 2, 3]));
    assert.deepEqual(lerChatsDoStorage(), {});
});

test("salvarChatsNoStorage grava exatamente o objeto serializado, e lerChatsDoStorage o recupera", () => {
    const chats = { matheus: [{ texto: "oi", souEu: true, data: "2024-01-01T00:00:00.000Z" }] };
    salvarChatsNoStorage(chats);

    assert.deepEqual(lerChatsDoStorage(), chats);
});
