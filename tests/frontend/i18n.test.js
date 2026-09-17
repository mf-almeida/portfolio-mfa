import { test } from "node:test";
import assert from "node:assert/strict";
import { formatText } from "../../public/js/i18n.js";

test("formatText substitui um placeholder pelo valor correspondente", () => {
    assert.equal(formatText("Olá {name}", { name: "Ana" }), "Olá Ana");
});

test("formatText substitui múltiplos placeholders diferentes", () => {
    assert.equal(
        formatText("{greeting}, {name}!", { greeting: "Oi", name: "Beto" }),
        "Oi, Beto!"
    );
});

test("formatText substitui por string vazia quando a chave não existe em values", () => {
    assert.equal(formatText("{missing}", {}), "");
});

test("formatText mantém template sem placeholders inalterado", () => {
    assert.equal(formatText("texto simples sem chaves", {}), "texto simples sem chaves");
});

test("formatText converte valores não-string para string", () => {
    assert.equal(formatText("total: {n}", { n: 42 }), "total: 42");
});
