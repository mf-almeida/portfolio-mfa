import { test } from "node:test";
import assert from "node:assert/strict";
import { projetosData } from "../../public/js/projetos.js";

const CHAVES_ESPERADAS = [
    "matheus",
    "pdz",
    "swift-file",
    "game-verse",
    "reunioes-aut",
    "portfolio-interativo"
];

test("projetosData é um objeto simples (não uma função)", () => {
    assert.equal(typeof projetosData, "object");
    assert.notEqual(projetosData, null);
    assert.equal(typeof projetosData, "object");
    assert.notEqual(typeof projetosData, "function");
});

test("projetosData tem exatamente as 6 chaves esperadas", () => {
    const chaves = Object.keys(projetosData);
    assert.equal(chaves.length, CHAVES_ESPERADAS.length);
    for (const chave of CHAVES_ESPERADAS) {
        assert.ok(
            Object.prototype.hasOwnProperty.call(projetosData, chave),
            `esperava a chave "${chave}" em projetosData`
        );
    }
});

test("cada entrada de projetosData tem tituloKey, defaultTitle e avatar como strings não-vazias", () => {
    for (const chave of CHAVES_ESPERADAS) {
        const entrada = projetosData[chave];
        assert.ok(entrada, `entrada "${chave}" deveria existir`);

        for (const campo of ["tituloKey", "defaultTitle", "avatar"]) {
            const valor = entrada[campo];
            assert.equal(typeof valor, "string", `${chave}.${campo} deveria ser string`);
            assert.ok(valor.length > 0, `${chave}.${campo} não deveria ser vazio`);
        }
    }
});
