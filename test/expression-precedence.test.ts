import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CalcEngine } from "../src/engine/calc-engine.ts";

describe("Formula Expression Display & Parentheses Precedence Engine (Issue #65)", () => {
  describe("1. Algebraic Operator Precedence (BODMAS/PEMDAS) in evaluateExpression()", () => {
    it("should prioritize multiplication over addition (2 + 3 * 4 = 14) (CASE-EXPR-03)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("2 + 3 * 4");
      assert.equal(result, 14);
    });

    it("should prioritize division over subtraction (20 - 10 / 2 = 15)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("20 - 10 / 2");
      assert.equal(result, 15);
    });

    it("should prioritize exponents over multiplication (2 * 3 ^ 2 = 18)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("2 * 3 ^ 2");
      assert.equal(result, 18);
    });

    it("should support parentheses overriding default operator precedence ((2 + 3) * 4 = 20)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("(2 + 3) * 4");
      assert.equal(result, 20);
    });

    it("should evaluate multi-level nested parentheses (((2 + 3) * 2) = 10) (CASE-EXPR-02)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("((2 + 3) * 2)");
      assert.equal(result, 10);
    });

    it("should evaluate complex combined algebraic expressions (3 * (2 + 4 ^ 2) / 2 = 27)", () => {
      const engine = new CalcEngine();
      const result = engine.evaluateExpression("3 * (2 + 4 ^ 2) / 2");
      assert.equal(result, 27);
    });

    it("should handle unary negative numbers and decimals correctly", () => {
      const engine = new CalcEngine();
      assert.equal(engine.evaluateExpression("-5 * 3"), -15);
      assert.equal(engine.evaluateExpression("10 + -3"), 7);
      assert.equal(engine.evaluateExpression("(0.1 + 0.2) * 10"), 3);
    });

    it("should handle implicit multiplication (2(3 + 4) = 14)", () => {
      const engine = new CalcEngine();
      assert.equal(engine.evaluateExpression("2(3 + 4)"), 14);
      assert.equal(engine.evaluateExpression("(2 + 3)(4 + 1)"), 25);
    });

    it("should throw Cannot divide by zero on division by zero inside expression (CASE-EXPR-07)", () => {
      const engine = new CalcEngine();
      assert.throws(() => {
        engine.evaluateExpression("10 / (5 - 5)");
      }, /Cannot divide by zero/);
    });
  });

  describe("2. Interactive Parentheses Input & State Flow in CalcEngine", () => {
    it("should increment parenDepth on '(' input and update expression", () => {
      const engine = new CalcEngine();
      engine.inputParenthesis("(");
      const state = engine.getState();
      assert.equal(state.parenDepth, 1);
      assert.equal(engine.getExpression(), "(");
    });

    it("should ignore ')' when parenDepth is 0 (CASE-EXPR-08, DEC-EXPR-01)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputParenthesis(")");
      const state = engine.getState();
      assert.equal(state.parenDepth, 0);
      assert.equal(engine.getExpression(), "5");
    });

    it("should auto-close unclosed parentheses upon calculate() (CASE-EXPR-04, DEC-EXPR-02)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("*");
      engine.inputParenthesis("(");
      engine.inputDigit("3");
      engine.inputOperator("+");
      engine.inputDigit("4");

      assert.equal(engine.getState().parenDepth, 1);
      const result = engine.calculate();
      assert.equal(result, "14");
      assert.equal(engine.getState().parenDepth, 0);
      assert.ok(engine.getExpression().includes("2 * (3 + 4) = 14"));
    });

    it("should evaluate nested parentheses calculation with auto-closing (((2 + 3) * 4 = 20)", () => {
      const engine = new CalcEngine();
      engine.inputParenthesis("(");
      engine.inputParenthesis("(");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.inputParenthesis(")");
      engine.inputOperator("*");
      engine.inputDigit("4");

      // parenDepth is 1 (one unclosed paren)
      assert.equal(engine.getState().parenDepth, 1);
      const result = engine.calculate();
      assert.equal(result, "20");
      assert.equal(engine.getState().parenDepth, 0);
    });

    it("should trap division by zero in parenthetical expression and lock engine (CASE-EXPR-07)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("1");
      engine.inputDigit("0");
      engine.inputOperator("/");
      engine.inputParenthesis("(");
      engine.inputDigit("5");
      engine.inputOperator("-");
      engine.inputDigit("5");
      engine.inputParenthesis(")");

      const result = engine.calculate();
      assert.equal(result, "Cannot divide by zero");
      assert.equal(engine.getState().isLocked, true);
      assert.equal(engine.getState().errorMessage, "Cannot divide by zero");
    });

    it("should replace consecutive operators before opening parenthesis (DEC-EXPR-03)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("5");
      engine.inputOperator("+");
      engine.inputOperator("*"); // Replaces '+' with '*'
      engine.inputParenthesis("(");
      engine.inputDigit("2");
      engine.inputOperator("+");
      engine.inputDigit("3");
      engine.inputParenthesis(")");

      const result = engine.calculate();
      assert.equal(result, "25"); // 5 * (2 + 3) = 25, not 5 + (2 + 3) = 10
    });

    it("should decrement parenDepth when backspace removes an open parenthesis (CASE-EXPR-09)", () => {
      const engine = new CalcEngine();
      engine.inputParenthesis("(");
      assert.equal(engine.getState().parenDepth, 1);
      engine.backspace();
      assert.equal(engine.getState().parenDepth, 0);
    });

    it("should synchronize Clear (C) and All Clear (AC) with expression state (CASE-EXPR-10)", () => {
      const engine = new CalcEngine();
      engine.inputDigit("2");
      engine.inputOperator("*");
      engine.inputParenthesis("(");
      engine.inputDigit("3");

      // C clears the '3' from active buffer
      engine.clear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getState().parenDepth, 1);

      // AC resets entire engine and expression
      engine.allClear();
      assert.equal(engine.getDisplay(), "0");
      assert.equal(engine.getExpression(), "");
      assert.equal(engine.getState().parenDepth, 0);
      assert.equal(engine.getState().accumulator, null);
    });
  });
});
