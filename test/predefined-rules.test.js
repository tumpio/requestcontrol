import fs from "fs";
import path from "path";
import { createMatchPatterns, createRule } from "../src/main/api";

const files = readRuleFiles();

test("Create rules", () => {
    const rules = files.flatMap((file) => file.map(createRule));
    expect(rules.length).toBeGreaterThan(0);
});

test("Create match patterns", () => {
    const allPatterns = files.flatMap((file) =>
        file.flatMap((rule) => {
            const patterns = createMatchPatterns(rule.pattern);
            expect(patterns.length).toBeGreaterThan(0);
            return patterns;
        })
    );
    expect(allPatterns.length).toBeGreaterThan(0);
});

function readRuleFiles() {
    return fs
        .readdirSync("./rules")
        .filter((name) => path.extname(name) === ".json")
        .map((name) => require(path.join("../rules", name)))
        .map((rules) => (Array.isArray(rules) ? rules : [rules]));
}
