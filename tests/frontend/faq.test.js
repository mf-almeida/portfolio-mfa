import { test } from "node:test";
import assert from "node:assert/strict";
import { faqKeyPara } from "../../public/js/faq.js";

test("faqKeyPara transforma o id do projeto na chave de FAQ esperada", () => {
    assert.equal(faqKeyPara("pdz"), "faq_pdz");
    assert.equal(faqKeyPara("swift-file"), "faq_swift_file");
    assert.equal(faqKeyPara("reunioes-aut"), "faq_reunioes_aut");
    assert.equal(faqKeyPara("portfolio-interativo"), "faq_portfolio_interativo");
});

test("faqKeyPara troca todos os hífens por underscore, não só o primeiro", () => {
    assert.equal(faqKeyPara("a-b-c-d"), "faq_a_b_c_d");
});

test("faqKeyPara mantém string sem hífens inalterada além do prefixo", () => {
    assert.equal(faqKeyPara("matheus"), "faq_matheus");
});
